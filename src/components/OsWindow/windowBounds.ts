import type { ComputedRef, InjectionKey } from 'vue'
import type { WindowBounds } from '@/tsInterface/index'

export const windowBoundsKey: InjectionKey<ComputedRef<WindowBounds>> = Symbol('window-bounds')
