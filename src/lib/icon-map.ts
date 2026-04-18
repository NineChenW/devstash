import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
} from 'lucide-react'
import type { ElementType } from 'react'

export const iconMap: Record<string, ElementType> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File,
  Image: ImageIcon,
}

export const DefaultIcon = Code
