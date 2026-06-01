import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { submitSubmission } from '@/lib/firebase'

export default function TestFirebase() {
  const [status, setStatus] = useState('')

  const handleSubmit = async () => {
    try {
      setStatus('Submitting...')
      await submitSubmission({
        email: 'test@example.com',
        study_group: 'A',
        sentence_id: '0',
        variant_a: 'informal',
        variant_b: 'formal',
        preference: 2
      })
      setStatus('Submission successful!')
    } catch (error) {
      setStatus(`Error: ${error}`)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '1rem' }}>Firebase Test</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Button onClick={handleSubmit}>Submit Test Data</Button>
      </div>

      {status && (
        <div style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem' }}>
          {status}
        </div>
      )}

    </div>
  )
}
