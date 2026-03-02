export type PackageTier = 'Basic' | 'Pro' | 'Premium'

export interface PackageFeature {
    name: string
    key: keyof TenantFeatures
    included: boolean
}

export interface TenantFeatures {
    has_properties: boolean
    has_agenda: boolean
    has_materials: boolean
    has_archive: boolean
    has_leads: boolean
    has_statistics: boolean
    has_reviews: boolean
    has_webshop: boolean
    has_billing: boolean
    has_voice: boolean
}

export interface PackageDefinition {
    id: PackageTier
    name: string
    description: string
    monthlyPrice: number
    annualPrice: number
    stripeProductId?: string
    features: TenantFeatures
}

// Default feature sets for each tier
const basicFeatures: TenantFeatures = {
    has_properties: true, // Core feature
    has_agenda: false,
    has_materials: false,
    has_archive: false,
    has_leads: false,
    has_statistics: false,
    has_reviews: false,
    has_webshop: false,
    has_billing: false,
    has_voice: false,
}

const proFeatures: TenantFeatures = {
    has_properties: true,
    has_agenda: true,
    has_materials: true,
    has_archive: true,
    has_leads: true,
    has_statistics: true,
    has_reviews: false,
    has_webshop: false,
    has_billing: false,
    has_voice: false,
}

const premiumFeatures: TenantFeatures = {
    has_properties: true,
    has_agenda: true,
    has_materials: true,
    has_archive: true,
    has_leads: true,
    has_statistics: true,
    has_reviews: true,
    has_webshop: true,
    has_billing: true,
    has_voice: true,
}

export const packagesConfig: Record<PackageTier, PackageDefinition> = {
    Basic: {
        id: 'Basic',
        name: 'Essential',
        description: 'Perfect voor de startende makelaar die een professionele basis zoekt.',
        monthlyPrice: 199,
        annualPrice: 1990,
        features: basicFeatures,
    },
    Pro: {
        id: 'Pro',
        name: 'Professional',
        description: 'Voor groeiende kantoren die agenda, leads en archief willen automatiseren.',
        monthlyPrice: 349,
        annualPrice: 3490,
        features: proFeatures,
    },
    Premium: {
        id: 'Premium',
        name: 'Elite',
        description: 'Het ultieme AI pakket inclusief webshop, facturatie en Voice Assist.',
        monthlyPrice: 599,
        annualPrice: 5990,
        features: premiumFeatures,
    }
}

// Helper to get features for a specific plan
export function getFeaturesForPlan(plan: PackageTier | string): TenantFeatures {
    if (plan === 'Premium') return premiumFeatures
    if (plan === 'Pro') return proFeatures
    return basicFeatures
}

// Helper to check if a specific feature is enabled in a plan
export function isFeatureEnabled(plan: PackageTier | string, featureKey: keyof TenantFeatures): boolean {
    const features = getFeaturesForPlan(plan)
    return features[featureKey]
}
