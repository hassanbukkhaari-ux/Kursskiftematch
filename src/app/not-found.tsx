import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#F6F3EE]">
      <div className="text-center max-w-sm">
        <div className="text-5xl font-serif font-semibold text-[#1C3829] mb-4">404</div>
        <h1 className="text-lg font-semibold text-[#1A1F1C] mb-2">Siden blev ikke fundet</h1>
        <p className="text-sm text-[#6B7569] mb-6 leading-relaxed">
          Den side du leder efter eksisterer ikke eller er blevet flyttet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center h-9 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors"
        >
          Gå til forsiden
        </Link>
      </div>
    </div>
  )
}
