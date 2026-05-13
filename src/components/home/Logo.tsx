import Link from 'next/link'

export function Logo() {
  return (
    <Link
      href="/"
      aria-label="DevStash home"
      className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-white"
    >
      <span
        aria-hidden="true"
        className="grid h-7 w-7 place-items-center rounded-lg text-white"
        style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]">
          <path
            d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>DevStash</span>
    </Link>
  )
}
