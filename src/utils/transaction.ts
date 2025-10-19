export function generateTid(prefix = 'T') {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const datePart = `${yyyy}${mm}${dd}` // local date in user's timezone
  const rand = Math.floor(Math.random() * 1e6).toString(36).padStart(6, '0')
  return `${prefix}${datePart}BR${rand.toUpperCase()}`
}
