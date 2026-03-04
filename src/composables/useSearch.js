import { ref } from 'vue'

const searchTerm = ref('')

const normalizeText = (value) => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const getProductSearchFields = (product) => {
  const name = normalizeText(product.name)
  const description = normalizeText(product.description)
  const attributes = normalizeText([
    product.category,
    product.subcategory,
    product.brand,
    product.model,
    product.socket,
    product.format,
    product.wattage,
    product.size,
    ...(Array.isArray(product.formFactors) ? product.formFactors : [])
  ].filter(Boolean).join(' '))

  return {
    name,
    description,
    attributes,
    all: `${name} ${description} ${attributes}`.trim()
  }
}

const buildQueryTokens = (query) => {
  return normalizeText(query)
    .split(/\s+/)
    .filter(token => token.length > 0)
}

const getSearchScore = (product, query) => {
  const tokens = buildQueryTokens(query)

  if (tokens.length === 0) {
    return 0
  }

  const fields = getProductSearchFields(product)
  const phrase = tokens.join(' ')
  let score = 0

  if (fields.name === phrase) {
    score += 300
  } else if (fields.name.includes(phrase)) {
    score += 120
  }

  for (const token of tokens) {
    if (!fields.all.includes(token)) {
      return 0
    }

    if (fields.name.startsWith(token)) {
      score += 45
    }

    if (fields.name.includes(token)) {
      score += 30
    }

    if (fields.attributes.includes(token)) {
      score += 15
    }

    if (fields.description.includes(token)) {
      score += 8
    }
  }

  return score
}

const matchesFullTextSearch = (product, query) => {
  return getSearchScore(product, query) > 0
}

export function useSearch() {
  return {
    searchTerm,
    matchesFullTextSearch,
    getSearchScore
  }
}