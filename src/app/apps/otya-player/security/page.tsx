import { permanentRedirect } from 'next/navigation'

export default function OtyaPlayerSecurityRedirect() {
  permanentRedirect('/help#security')
}
