import { ref } from 'vue'

const searchTerm = ref('')

export function useSearch() {
  return {
    searchTerm
  }
}