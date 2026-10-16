import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black pb-24 pt-10 md:pb-10">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">

        {/* BRAND */}
        <div className="mb-10">
          <img
            src="/logo-fainstore-footer.png"
            alt="FAIN STORE"
            className="h-16 w-auto object-contain"
          />

          <p className="mt-5 max-w-xl text-sm leading-6 text-white/45">
            Marketplace game dan produk digital untuk kebutuhan gaming kamu.
          </p>

          {/* SOCIAL */}
          <div className="mt-6 flex items-center gap-3">

            {/* WHATSAPP */}
            <a
              href="https://wa.me/6281534564582"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp FAIN STORE"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-200 hover:scale-105 hover:bg-white/[0.07]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path
                  fill="#25D366"
                  d="M12 1.5a10.5 10.5 0 0 0-9.02 15.88L1.5 22.5l5.25-1.38A10.5 10.5 0 1 0 12 1.5Z"
                />
                <path
                  fill="#ffffff"
                  d="M16.48 13.67c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.18-.71-.63-1.19-1.4-1.33-1.64-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.57 4.1 3.61.57.25 1.01.4 1.36.51.57.18 1.09.15 1.5.09.46-.07 1.42-.58 1.62-1.13.2-.54.2-1.01.14-1.11-.06-.1-.22-.16-.46-.28Z"
                />
              </svg>
            </a>

            {/* INSTAGRAM */}
            <a
              href="https://www.instagram.com/fainstore__/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram FAIN STORE"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-200 hover:scale-105 hover:bg-white/[0.07]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="fain-instagram-gradient"
                    x1="2"
                    y1="22"
                    x2="22"
                    y2="2"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#FFD600" />
                    <stop offset="0.28" stopColor="#FF7A00" />
                    <stop offset="0.55" stopColor="#FF0069" />
                    <stop offset="0.78" stopColor="#D300C5" />
                    <stop offset="1" stopColor="#7638FA" />
                  </linearGradient>
                </defs>

                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="5.5"
                  fill="url(#fain-instagram-gradient)"
                />

                <rect
                  x="6.5"
                  y="6.5"
                  width="11"
                  height="11"
                  rx="3.2"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                />

                <circle
                  cx="12"
                  cy="12"
                  r="2.7"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                />

                <circle
                  cx="17.25"
                  cy="6.75"
                  r="1.1"
                  fill="#ffffff"
                />
              </svg>
            </a>

          </div>
        </div>

        {/* LINKS */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3">

          <div>
            <h4 className="mb-5 text-sm font-semibold text-white">
              Peta Situs
            </h4>

            <ul className="space-y-4 text-sm text-white/55">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/produk" className="transition-colors hover:text-white">
                  Produk
                </Link>
              </li>
              <li>
                <Link href="/top-up" className="transition-colors hover:text-white">
                  Top Up
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold text-white">
              Dukungan
            </h4>

            <ul className="space-y-4 text-sm text-white/55">
              <li>
                <a
                  href="https://wa.me/6281534564582"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  WhatsApp
                </a>
              </li>

              <li>
                <a
                  href="https://www.instagram.com/fainstore__/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold text-white">
              Legalitas
            </h4>

            <ul className="space-y-4 text-sm text-white/55">
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-white"
                >
                  Kebijakan Pribadi
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-white"
                >
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="mt-10 border-t border-white/10 pt-5">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} FAIN STORE. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
