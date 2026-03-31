import { ref, computed } from 'vue'
import { apiService } from '@/services/api'

interface LearningGoal {
  id: number
  label: string
}

interface Subject {
  id: number
  name: string
}

interface TeacherQuality {
  id: number
  label: string
}

interface RegistrationOptions {
  learning_goals?: LearningGoal[]
  subjects?: Subject[]
  teacher_qualities?: TeacherQuality[]
}

// Global cache
let cachedOptions: RegistrationOptions | null = null
const isLoading = ref(false)
const error = ref<string | null>(null)

/**
 * Fetch and cache registration options (learning goals, subjects, teacher qualities)
 * These are fetched once and reused throughout the app
 */
export const useRegistrationOptions = () => {
  const options = ref<RegistrationOptions>({})

  const fetchOptions = async () => {
    // Return cached options if already loaded
    if (cachedOptions) {
      console.log('[fetchOptions] Returning cached options:', cachedOptions)
      options.value = cachedOptions
      return cachedOptions
    }

    if (isLoading.value) return options.value

    isLoading.value = true
    error.value = null

    try {
      console.log('[fetchOptions] Fetching from /registration/options...')
      const response = await apiService.get('/registration/options')
      
      console.log('[fetchOptions] Full response:', response)
      console.log('[fetchOptions] response.data:', response.data)
      
      // Extract the options object from the response
      // Backend returns: { "options": { "learning_goals": [...], "subjects": [...], ... } }
      const data = response.data?.options || response.data || {}
      
      console.log('[fetchOptions] Extracted data:', data)
      console.log('[fetchOptions] Data keys:', Object.keys(data))
      console.log('[fetchOptions] learning_goals:', data.learning_goals)
      console.log('[fetchOptions] subjects:', data.subjects)
      console.log('[fetchOptions] teacher_qualities:', data.teacher_qualities)

      // Ensure subjects array uses 'name' field consistently
      if (data.subjects && Array.isArray(data.subjects)) {
        console.log('[fetchOptions] Sample subject:', data.subjects[0])
      }

      cachedOptions = data
      options.value = data

      return data
    } catch (err) {
      error.value = `Failed to fetch registration options: ${err}`
      console.error('[fetchOptions] Error:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Helper function to look up learning goal name by ID
  const getLearningGoalName = (id: number): string => {
    if (!options.value || !options.value.learning_goals) {
      console.warn('[getLearningGoalName] learning_goals not loaded yet, returning Unknown for ID:', id)
      return 'Unknown'
    }
    const goal = options.value.learning_goals.find(g => g.id === id)
    const result = goal ? goal.label : `Unknown (ID: ${id})`
    console.log('[getLearningGoalName] ID:', id, '-> Result:', result)
    return result
  }

  // Helper function to look up subject name by ID
  const getSubjectName = (id: number): string => {
    if (!options.value || !options.value.subjects) {
      console.warn('[getSubjectName] subjects not loaded yet, returning Unknown for ID:', id)
      return 'Unknown'
    }
    const subject = options.value.subjects.find(s => s.id === id)
    const result = subject ? subject.name : `Unknown (ID: ${id})`
    console.log('[getSubjectName] ID:', id, '-> Found subject:', subject, '-> Result:', result)
    return result
  }

  // Helper function to look up teacher quality name by ID
  const getTeacherQualityName = (id: number): string => {
    if (!options.value || !options.value.teacher_qualities) {
      console.warn('[getTeacherQualityName] teacher_qualities not loaded yet, returning Unknown for ID:', id)
      return 'Unknown'
    }
    const quality = options.value.teacher_qualities.find(q => q.id === id)
    const result = quality ? quality.label : `Unknown (ID: ${id})`
    console.log('[getTeacherQualityName] ID:', id, '-> Result:', result)
    return result
  }

  // Helper function to convert an array of IDs to comma-separated names
  const getNamesByIds = (ids: number[], type: 'learning_goals' | 'subjects' | 'teacher_qualities'): string => {
    console.log(`[getNamesByIds] Called with IDs: ${JSON.stringify(ids)}, Type: ${type}`)
    console.log(`[getNamesByIds] Available options.${type}:`, options.value[type as keyof RegistrationOptions])
    
    if (!Array.isArray(ids) || ids.length === 0) return 'None'

    const lookupFn = {
      learning_goals: getLearningGoalName,
      subjects: getSubjectName,
      teacher_qualities: getTeacherQualityName,
    }[type]

    const result = ids.map(id => lookupFn(id)).join(', ')
    console.log(`[getNamesByIds] Result: ${result}`)
    
    return result
  }

  return {
    options: computed(() => options.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    fetchOptions,
    getLearningGoalName,
    getSubjectName,
    getTeacherQualityName,
    getNamesByIds,
  }
}
