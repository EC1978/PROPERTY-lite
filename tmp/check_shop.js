const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndSeed() {
    console.log('Checking shop_products...')
    const { data: products, error: fetchError } = await supabase.from('shop_products').select('*')

    if (fetchError) {
        console.error('Error fetching products:', fetchError)
        return
    }

    console.log(`Found ${products?.length || 0} products.`)

    if (!products || products.length === 0) {
        console.log('Seeding products...')
        const demoProducts = [
            {
                name: 'Te Koop Borden (V-bord)',
                slug: 'te-koop-borden',
                description: 'Kwalitatieve V-borden voor raambevestiging.',
                price: 45.00,
                images: ['https://pnmqqbtxofvefuykueax.supabase.co/storage/v1/object/public/products/v-bord.jpg'],
                options: { sizes: ['70x100cm', '50x70cm'] }
            },
            {
                name: 'Tuinborden (L-bord)',
                slug: 'tuinborden',
                description: 'Robuuste L-borden voor in de tuin.',
                price: 85.00,
                images: ['https://pnmqqbtxofvefuykueax.supabase.co/storage/v1/object/public/products/tuinbord.jpg'],
                options: { sizes: ['60x40cm'] }
            }
        ]

        const { error: insertError } = await supabase.from('shop_products').insert(demoProducts)
        if (insertError) console.error('Error seeding products:', insertError)
        else console.log('Successfully seeded 2 products.')
    }
}

checkAndSeed()
