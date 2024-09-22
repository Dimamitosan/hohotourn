'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const JoinLobby = () => {
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleJoinLobby = () => {
    router.push(`/lobby/${code}`)
  }

  return (
    <div>
      <h1>Присоединиться к лобби</h1>
      <input
        type="text"
        placeholder="Введите код лобби"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleJoinLobby}>Присоединиться</button>
    </div>
  )
}

export default JoinLobby
