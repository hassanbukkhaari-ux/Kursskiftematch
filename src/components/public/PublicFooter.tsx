import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#E0DAD0] bg-[#F6F3EE]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#C8993A] flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 13L8 3L13 13" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 9.5h6" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-serif font-semibold text-[#1C3829] text-sm">Kursskifte</span>
            </div>
            <p className="text-xs text-[#6B7569] leading-relaxed">
              Relationsbaseret støtte med kvalitetssikrede kontaktpersoner til borgere i mistrivsel.
            </p>
          </div>

          {/* Kommuner */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">Kommuner</div>
            <div className="space-y-2">
              <Link href="/kommuner" className="block text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">Sådan virker det</Link>
              <Link href="/intake" className="block text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">Indsend sag</Link>
              <Link href="/kontakt" className="block text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">Kontakt os</Link>
            </div>
          </div>

          {/* Kontaktpersoner */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">Kontaktpersoner</div>
            <div className="space-y-2">
              <Link href="/kontaktpersoner" className="block text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">Bliv kontaktperson</Link>
              <Link href="/metode" className="block text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">Vores metode</Link>
              <Link href="/login" className="block text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">Log ind på platform</Link>
            </div>
          </div>

          {/* Om */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">Om Kursskifte</div>
            <div className="space-y-2">
              <Link href="/om-kursskifte" className="block text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">Om os</Link>
              <Link href="/kontakt" className="block text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">Kontakt</Link>
              <a href="#" className="block text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">Privatlivspolitik</a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E0DAD0] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-[#6B7569]">© 2025 Kursskifte ApS · CVR: — · kursskifte.dk</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            <span className="text-xs text-[#6B7569]">GDPR-compliant · Data behandles sikkert i Danmark</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
