import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkSlots() {
  const { data: doctors, error: dError } = await supabase.from('profiles').select('*').ilike('name', '%shahzil%')
  console.log('Doctors:', doctors)

  if (doctors && doctors.length > 0) {
    const doctorId = doctors[0].id
    const { data: slots, error: sError } = await supabase.from('availability_slots').select('*').eq('doctor_id', doctorId)
    console.log('Slots for doctor:', slots)
    console.log('Error:', sError)
  }
}

checkSlots()
