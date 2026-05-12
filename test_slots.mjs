import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf-8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value.length > 0) {
    envVars[key.trim()] = value.join('=').trim()
  }
})

const supabase = createClient(
  envVars['VITE_SUPABASE_URL'],
  envVars['VITE_SUPABASE_ANON_KEY']
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
