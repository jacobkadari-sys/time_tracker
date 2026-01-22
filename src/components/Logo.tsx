'use client'

import Image from 'next/image'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 80, height: 80 }
  }

  const s = sizes[size]

  return (
    <div className="relative flex items-center justify-center border-2 border-dog-gold shadow-retro-sm bg-black"
         style={{ width: s.width, height: s.height }}>
      <Image
        src="/departmentofgrowth_logo.jpeg"
        alt="Department of Growth"
        width={s.width}
        height={s.height}
        className="object-contain"
        priority
      />
    </div>
  )
}

export function LogoWithText({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  }

  return (
    <div className="flex items-center gap-3">
      <Logo size={size} />
      <div>
        <h1 className={`${textSizes[size]} font-bold text-dog-brown leading-none`}>
          Department of Growth
        </h1>
        <p className="text-xs text-dog-brown opacity-70">Time Tracker</p>
      </div>
    </div>
  )
}
