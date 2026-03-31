/**
 * Helper functions for parsing and formatting application data
 */

// Define the 15 lesson time slots (ID -> time mapping from database)
const TIME_SLOTS: Record<number, string> = {
  1: '08:00-09:00',
  2: '09:00-10:00',
  3: '10:15-11:15',
  4: '11:15-12:15',
  5: '12:30-13:30',
  6: '13:30-14:30',
  7: '14:45-15:45',
  8: '15:45-16:45',
  9: '17:00-18:00',
  10: '18:00-19:00',
  11: '19:15-20:15',
  12: '20:15-21:15',
  13: '21:30-22:30',
  14: '22:30-23:30',
  15: '23:45-00:45',
};

// Convert HH:MM to minutes since midnight
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Convert minutes since midnight back to HH:MM
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Consolidate time slots with 60-minute gap tolerance
// Handles slot IDs like [1,2,3] which map to actual times
export const consolidateTimeSlots = (availabilityJson: string, availabilityDescription: string): string => {
  console.log('[consolidateTimeSlots] Input availabilityJson:', availabilityJson)
  console.log('[consolidateTimeSlots] Input availabilityDescription:', availabilityDescription)
  console.log('[consolidateTimeSlots] Type of availabilityJson:', typeof availabilityJson)
  
  if (!availabilityJson) {
    return availabilityDescription || 'Not specified'
  }

  try {
    const availability = JSON.parse(availabilityJson)
    console.log('[consolidateTimeSlots] Parsed availability object:', availability)
    
    if (!availability || typeof availability !== 'object') {
      return availabilityDescription || 'Not specified'
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const result: string[] = []

    for (const day of days) {
      const slotIds = availability[day]
      console.log(`[consolidateTimeSlots] ${day} slotIds:`, slotIds, 'isArray:', Array.isArray(slotIds))
      
      if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) continue

      // Convert slot IDs to times
      const parsed = slotIds
        .map((slotId: number, index: number) => {
          console.log(`[consolidateTimeSlots] ${day} slot ${index}: ID ${slotId}`)
          const timeRange = TIME_SLOTS[slotId]
          if (!timeRange) {
            console.warn(`[consolidateTimeSlots] Unknown slot ID: ${slotId}`)
            return null
          }
          const [start, end] = timeRange.split('-')
          return {
            start: timeToMinutes(start),
            end: timeToMinutes(end),
            display: timeRange,
          }
        })
        .filter((slot): slot is { start: number; end: number; display: string } => slot !== null)
        .sort((a, b) => a.start - b.start)

      // Consolidate slots with up to 60-minute gaps
      const consolidated: typeof parsed = []
      for (const slot of parsed) {
        if (consolidated.length === 0) {
          consolidated.push(slot)
        } else {
          const lastSlot = consolidated[consolidated.length - 1]
          const gapMinutes = slot.start - lastSlot.end

          console.log(`[consolidateTimeSlots] Gap between ${lastSlot.display} and ${slot.display}: ${gapMinutes} minutes`)

          if (gapMinutes <= 60) {
            // Merge slots
            lastSlot.end = Math.max(lastSlot.end, slot.end)
            lastSlot.display = `${lastSlot.display.split('-')[0]}-${minutesToTime(lastSlot.end)}`
          } else {
            // Keep as separate slot
            consolidated.push(slot)
          }
        }
      }

      // Format for display
      const displaySlots = consolidated.map((slot) => slot.display).join('; ')
      const dayName = day.charAt(0).toUpperCase() + day.slice(1)
      result.push(`${dayName}: ${displaySlots}`)
    }

    const finalResult = result.length > 0 ? result.join(' | ') : (availabilityDescription || 'Not specified')
    console.log('[consolidateTimeSlots] Final result:', finalResult)
    return finalResult
  } catch (error) {
    console.error('[consolidateTimeSlots] Error parsing availability:', error)
    return availabilityDescription || 'Invalid availability data'
  }
}

// Parse desired subjects from JSON array, string, or single value
export const parseSubjects = (subjectsData: any): string => {
  console.log('[parseSubjects] Input subjectsData:', subjectsData, 'type:', typeof subjectsData)
  
  if (!subjectsData) return 'Not specified'

  try {
    // If it's a string that looks like JSON
    if (typeof subjectsData === 'string') {
      if (subjectsData.startsWith('[')) {
        const subjects = JSON.parse(subjectsData)
        console.log('[parseSubjects] Parsed JSON array:', subjects)
        if (Array.isArray(subjects)) {
          return subjects.length > 0 ? subjects.join(', ') : 'Not specified'
        }
      }
      // Return string as-is
      return subjectsData ? subjectsData : 'Not specified'
    }
    
    // If it's already an array
    if (Array.isArray(subjectsData)) {
      return subjectsData.join(', ') || 'Not specified'
    }

    // Otherwise return as string
    console.log('[parseSubjects] Returning as-is:', subjectsData)
    return String(subjectsData)
  } catch (error) {
    console.log('[parseSubjects] Parse error, returning as-is:', subjectsData)
    return subjectsData ? String(subjectsData) : 'Not specified'
  }
}

// Format teacher preferences from JSON object
export const formatTeacherPreferences = (preferencesJson: string): string => {
  console.log('[formatTeacherPreferences] Input:', preferencesJson)
  
  if (!preferencesJson) return 'Not specified'

  try {
    const prefs = JSON.parse(preferencesJson)
    
    if (!prefs || typeof prefs !== 'object') return 'Not specified'

    const parts: string[] = []

    if (prefs.gender) {
      parts.push(`Gender: ${capitalizeFirst(prefs.gender)}`)
    }
    
    if (prefs.relationship_style) {
      parts.push(`Relationship Style: ${capitalizeFirst(prefs.relationship_style)}`)
    }
    
    if (Array.isArray(prefs.qualities) && prefs.qualities.length > 0) {
      parts.push(`Qualities: ${prefs.qualities.map(capitalizeFirst).join(', ')}`)
    }
    
    if (prefs.comments) {
      parts.push(`Comments: ${prefs.comments}`)
    }

    return parts.length > 0 ? parts.join(' | ') : 'Not specified'
  } catch (error) {
    console.error('[formatTeacherPreferences] Error:', error)
    return 'Not specified'
  }
}

// Parse any JSON field and format appropriately
export const parseJsonField = (jsonString: string | null, fallback = 'Not specified'): string => {
  console.log('[parseJsonField] Input jsonString:', jsonString, 'type:', typeof jsonString, 'fallback:', fallback)
  
  if (!jsonString) return fallback

  try {
    const parsed = JSON.parse(jsonString)
    console.log('[parseJsonField] Successfully parsed JSON:', parsed, 'type:', typeof parsed)
    
    if (Array.isArray(parsed)) {
      const result = parsed.length > 0 ? parsed.join(', ') : fallback
      console.log('[parseJsonField] Is array, result:', result)
      return result
    } else if (typeof parsed === 'object') {
      const stringified = JSON.stringify(parsed)
      console.log('[parseJsonField] Is object, stringified:', stringified)
      return stringified
    }
    
    const result = parsed?.toString() || fallback
    console.log('[parseJsonField] Converted to string:', result)
    return result
  } catch (error) {
    console.log('[parseJsonField] Parse error, returning as-is:', jsonString)
    return jsonString || fallback
  }
}

// Helper to capitalize first letter
const capitalizeFirst = (str: string): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
