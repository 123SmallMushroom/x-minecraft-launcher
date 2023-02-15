import { File, FileRelationType } from '@xmcl/curseforge'
import { ProjectVersion } from '@xmcl/modrinth'
import { CurseForgeServiceKey, ModrinthServiceKey, Resource } from '@xmcl/runtime-api'
import { InjectionKey } from 'vue'
import { useService } from './service'

export interface ModListFileItem {
  id: string
  mutex: string
  name: string

  curseforge?: File
  modrinth?: ProjectVersion
  resource?: Resource

  dependencies: ModListFileLeaveItem[]
  embedded: Omit<ModListFileItem, 'dependencies' | 'incompatible' | 'embedded'>[]
  incompatible: Omit<ModListFileItem, 'dependencies' | 'incompatible' | 'embedded'>[]

  disabled: boolean
}

export type ModListFileLeaveItem = Omit<ModListFileItem, 'dependencies' | 'incompatible' | 'embedded'> & {
  type: 'required' | 'optional'
  parent: ModListFileItem
}

export const kModInstallList = Symbol('ModInstallList') as InjectionKey<ReturnType<typeof useModInstallList>>

export function useModInstallList() {
  const list = ref([] as ModListFileItem[])

  async function add(item: File | ProjectVersion | Resource, icon?: string) {
    const id = 'path' in item ? item.path : 'project_id' in item ? item.id : item.id.toString()
    const name = 'path' in item ? item.fileName : 'project_id' in item ? item.name : item.displayName.toString()
    const curseforge = 'modId' in item ? item : undefined
    const modrinth = 'project_id' in item ? item : undefined
    const resource = 'path' in item ? item : undefined
    const result: ModListFileItem = {
      id,
      mutex: '',
      name,

      curseforge,
      modrinth,
      resource,

      disabled: false,
      dependencies: [],
    }
    await refreshDependencies(result)
    const previous = list.value
    // const match = (a: ModListFileItem, b: ModListFileItem) => {
    //   return false
    // }
    for (const i of previous) {
      // if (!i.disabled && i.mutex === ) {
      // }
      // const incompatible = previous.filter(p => match(p, i)
      //   && !(i.type === 'incompatible' && p.type === 'incompatible')
      //   && !i.disabled && !p.disabled
      // )
      // i.incompatbile = incompatible
      // for (const p of incompatible) {
      //   p.incompatbile = [i]
      // }
    }
    list.value.push(result)
  }

  function remove(item: string) {
    list.value = list.value.filter(i => i.id !== item)
  }

  function enable(item: ModListFileItem) {
    // if (!item.disabled) return
    // if (item.type === 'embedded') return
    // if (item.type === 'incompatible') return

    // item.disabled = false
  }

  const { resolveFileDependencies: resolveCurseforge } = useService(CurseForgeServiceKey)
  const { resolveDependencies: resolveModrinth } = useService(ModrinthServiceKey)

  async function refreshDependencies(parent: ModListFileItem) {
    if (parent.curseforge) {
      const result = await resolveCurseforge(parent.curseforge)
      for (const [file, type] of result) {
        const depType = type === FileRelationType.RequiredDependency
          ? 'required'
          : type === FileRelationType.OptionalDependency || type === FileRelationType.Tool
            ? 'optional'
            : type === FileRelationType.Incompatible
              ? 'incompatible'
              : 'embedded'
        parent.dependencies.push({
          id: file.id.toString(),
          name: file.displayName,
          curseforge: file,
          parent,
          type: depType,
          disabled: depType !== 'required',
          mutex: '',
        })
      }
    } else if (parent.modrinth) {
      const result = await resolveModrinth(parent.modrinth)
      const deps = parent.modrinth.dependencies
      for (const v of result) {
        const dep = deps.find(d => d.version_id === v.id && d.project_id === v.project_id)
        if (!dep) {
          continue
        }
        parent.dependencies.push({
          id: v.id.toString(),
          name: v.name,
          modrinth: v,
          parent,
          type: dep.dependency_type,
          disabled: dep.dependency_type !== 'required',
          mutex: '',
        })
      }
    }
  }

  async function commit() {
    // list.value.filter(i => i.)
  }

  return {
    list,
    add,
    remove,
    commit,
  }
}
