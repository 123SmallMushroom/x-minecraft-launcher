import { InstanceShaderPacksService as IInstanceShaderPacksServic, InstanceShaderPacksServiceKey, isPersistedResource, isShaderPackResource, ResourceDomain } from '@xmcl/runtime-api'
import { ensureDir, existsSync, lstat, move, readdir, readlink, remove, unlink } from 'fs-extra'
import { join } from 'path'
import { LauncherApp } from '../app/LauncherApp'
import { LauncherAppKey } from '../app/utils'
import { isSystemError } from '../util/error'
import { createSymbolicLink, ENOENT_ERROR, linkWithTimeoutOrCopy } from '../util/fs'
import { Inject } from '../util/objectRegistry'
import { InstanceService } from './InstanceService'
import { ResourceService } from './ResourceService'
import { AbstractService, ExposeServiceKey, Singleton } from './Service'

@ExposeServiceKey(InstanceShaderPacksServiceKey)
export class InstanceShaderPacksService extends AbstractService implements IInstanceShaderPacksServic {
  private active: string | undefined

  constructor(@Inject(LauncherAppKey) app: LauncherApp,
    @Inject(ResourceService) private resourceService: ResourceService,
    @Inject(InstanceService) private instanceService: InstanceService,
  ) {
    super(app)
    this.storeManager.subscribe('instanceShaderOptions', async (payload) => {
      if (payload.shaderPack && this.active && !this.instanceService.isUnderManaged(this.active)) {
        const fileName = payload.shaderPack

        const existedResource = await this.resourceService.getResourceUnder({ fileName, domain: ResourceDomain.ShaderPacks })
        const localFilePath = join(this.active!, fileName)
        if (!existsSync(localFilePath)) {
          if (existedResource) {
            linkWithTimeoutOrCopy(existedResource.path, localFilePath)
          }
        }
      }
    })
    this.storeManager.subscribe('instanceSelect', (payload) => {
      this.link(payload)
    })
  }

  @Singleton(p => p)
  async link(instancePath: string = this.instanceService.state.path) {
    const destPath = join(instancePath, 'shaderpacks')
    const srcPath = this.getPath('shaderpacks')
    const stat = await lstat(destPath).catch((e) => {
      if (isSystemError(e) && e.code === ENOENT_ERROR) {
        return
      }
      throw e
    })
    this.active = destPath
    const loadAll = async () => {
      const files = await readdir(destPath)

      this.log(`Import shaderpacks directories while linking: ${instancePath}`)
      await Promise.all(files.map(f => join(destPath, f)).map(async (filePath) => {
        const [resource] = await this.resourceService.importResources([{ path: filePath, domain: ResourceDomain.ShaderPacks }])
        if (isShaderPackResource(resource)) {
          this.log(`Add shader pack ${filePath}`)
        } else {
          this.warn(`Non shader pack resource added in /shaderpacks directory! ${filePath}`)
        }
      }))
    }
    await this.resourceService.whenReady(ResourceDomain.ShaderPacks)
    this.log(`Linking the shaderpacks at domain to ${instancePath}`)
    if (stat) {
      if (stat.isSymbolicLink()) {
        if (await readlink(destPath) === srcPath) {
          this.log(`Skip linking the shaderpacks at domain as it already linked: ${instancePath}`)
          return
        }
        this.log(`Relink the shaderpacks domain: ${instancePath}`)
        await unlink(destPath)
      } else {
        // Import all directory content
        if (stat.isDirectory()) {
          await loadAll()
          if (!this.instanceService.isUnderManaged(instancePath)) {
            // do not link if this is not an managed instance
            return
          } else {
            await remove(destPath)
          }
        } else {
          await move(destPath, `${destPath}_backup`)
        }
      }
    } else if (!this.instanceService.isUnderManaged(instancePath)) {
      // do not link if this is not an managed instance
      await ensureDir(destPath)
      return
    }

    await createSymbolicLink(srcPath, destPath)
  }

  async showDirectory(): Promise<void> {
    await this.app.shell.openDirectory(join(this.instanceService.state.path, 'shaderpacks'))
  }
}
