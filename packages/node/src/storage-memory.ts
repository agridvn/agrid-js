import { AgridPersistedProperty } from '@agrid/core'

export class AgridMemoryStorage {
  private _memoryStorage: { [key: string]: any | undefined } = {}

  getProperty(key: AgridPersistedProperty): any | undefined {
    return this._memoryStorage[key]
  }

  setProperty(key: AgridPersistedProperty, value: any | null): void {
    this._memoryStorage[key] = value !== null ? value : undefined
  }
}
