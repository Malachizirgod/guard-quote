const API_BASE = '/api'
const ML_BASE = '/ml'

// ============================================
// Backend API (MySQL data)
// ============================================

export const api = {
  async getQuotes() {
    const res = await fetch(`${API_BASE}/quotes`)
    return res.json()
  },

  async createQuote(data: QuoteInput) {
    const res = await fetch(`${API_BASE}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  async getClients() {
    const res = await fetch(`${API_BASE}/clients`)
    return res.json()
  },

  async createClient(data: ClientInput) {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },
}

// ============================================
// ML Engine API (Predictions)
// ============================================

export const mlApi = {
  async getHealth() {
    const res = await fetch(`${ML_BASE}/health`)
    return res.json()
  },

  async getModelInfo() {
    const res = await fetch(`${ML_BASE}/model-info`)
    return res.json()
  },

  async getQuotePrediction(data: MLQuoteRequest): Promise<MLQuoteResponse> {
    const res = await fetch(`${ML_BASE}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: data.eventType,
        location_zip: data.locationZip,
        num_guards: data.numGuards,
        hours: data.hours,
        date: data.eventDate,
        is_armed: data.isArmed || false,
        requires_vehicle: data.requiresVehicle || false,
        crowd_size: data.crowdSize || 0,
      }),
    })
    return res.json()
  },

  async getRiskAssessment(data: MLQuoteRequest): Promise<RiskAssessmentResponse> {
    const res = await fetch(`${ML_BASE}/risk-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: data.eventType,
        location_zip: data.locationZip,
        num_guards: data.numGuards,
        hours: data.hours,
        date: data.eventDate,
        is_armed: data.isArmed || false,
        requires_vehicle: data.requiresVehicle || false,
        crowd_size: data.crowdSize || 0,
      }),
    })
    return res.json()
  },

  async getEventTypes() {
    const res = await fetch(`${ML_BASE}/event-types`)
    return res.json()
  },
}

// ============================================
// Types
// ============================================

export interface QuoteInput {
  clientId?: number
  eventType: string
  locationZip: string
  numGuards: number
  hours: number
  eventDate: string
  isArmed?: boolean
  requiresVehicle?: boolean
  crowdSize?: number
}

export interface ClientInput {
  companyName: string
  contactName?: string
  email: string
  phone?: string
  city?: string
  state?: string
  zipCode?: string
}

export interface MLQuoteRequest {
  eventType: string
  locationZip: string
  numGuards: number
  hours: number
  eventDate: string
  isArmed?: boolean
  requiresVehicle?: boolean
  crowdSize?: number
}

export interface MLQuoteResponse {
  base_price: number
  risk_multiplier: number
  final_price: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  confidence_score: number
  breakdown: {
    model_used: string
    risk_factors: string[]
    num_guards: number
    hours: number
    is_armed: boolean
    has_vehicle: boolean
  }
}

export interface RiskAssessmentResponse {
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_score: number
  factors: string[]
  recommendations: string[]
}
