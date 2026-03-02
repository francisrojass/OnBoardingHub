import React from 'react'

export default function Card({ children, className = '' }: any){
  return <div className={`card p-4 ${className}`}>{children}</div>
}
