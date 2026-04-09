import { useParams } from 'react-router-dom'
import { WhoIsThis } from './WhoIsThis'
import { WhatDayIsIt } from './WhatDayIsIt'
import { FindObject } from './FindObject'
import { SeriesPatterns } from './SeriesPatterns'
import { MemoryCards } from './MemoryCards'
import { WordSearch } from './WordSearch'
import { MemoryGallery } from './MemoryGallery'
import { BreathingExercise } from './BreathingExercise'
import { MoodCheckIn } from './MoodCheckIn'
import { OrderStory } from './OrderStory'
import { SimplePuzzle } from './SimplePuzzle'
import { Coloring } from './Coloring'
import { CompleteSong } from './CompleteSong'
import { WhatIsMissing } from './WhatIsMissing'
import { Proverbs } from './Proverbs'
import { OddOneOut } from './OddOneOut'
import { SimpleMath } from './SimpleMath'
import { Sudoku } from './Sudoku'
import { ColorMatch } from './ColorMatch'
import { WhatIsThisObject } from './WhatIsThisObject'
import { WordBuilder } from './WordBuilder'

const ACTIVITY_MAP: Record<string, React.ComponentType> = {
  who_is_this: WhoIsThis,
  what_day_is_it: WhatDayIsIt,
  find_object: FindObject,
  series_patterns: SeriesPatterns,
  memory_cards: MemoryCards,
  word_search: WordSearch,
  memory_gallery: MemoryGallery,
  breathing: BreathingExercise,
  mood_checkin: MoodCheckIn,
  order_story: OrderStory,
  simple_puzzle: SimplePuzzle,
  coloring: Coloring,
  complete_song: CompleteSong,
  what_is_missing: WhatIsMissing,
  proverbs: Proverbs,
  odd_one_out: OddOneOut,
  simple_math: SimpleMath,
  sudoku: Sudoku,
  color_match: ColorMatch,
  what_is_this_object: WhatIsThisObject,
  word_builder: WordBuilder,
}

export function ActivityRouter() {
  const { type } = useParams<{ type: string }>()
  const Component = type ? ACTIVITY_MAP[type.toLowerCase()] : undefined

  if (!Component) {
    return (
      <div className="p-8 text-center text-2xl font-black text-[#5C4033]">
        Actividad en construcción 🚧
      </div>
    )
  }

  return <Component />
}
