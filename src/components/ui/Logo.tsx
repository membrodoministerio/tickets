'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Logo({ size = 'medium' }) {
  // Tamanhos disponíveis para o logo
  const sizes = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 }
  };
  
  const { width, height } = sizes[size] || sizes.medium;
  
  // Usar o logo completo em tamanhos maiores, e o ícone em tamanhos menores
  const logoSrc = size === 'small' 
    ? '/images/primeip-logo-icon.jpeg' 
    : '/images/primeip-logo-full.jpeg';
  
  return (
    <div className="flex items-center">
      <Image 
        src={logoSrc}
        alt="PrimeIP Logo"
        width={width}
        height={height}
        className="rounded-md"
      />
      {size === 'small' && (
        <span className="ml-2 text-white font-bold">PrimeIP</span>
      )}
    </div>
  );
}
