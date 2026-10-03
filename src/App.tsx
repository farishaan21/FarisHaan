/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Custom typewriter hook
function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);

    let index = 0;
    let intervalId: number | null = null;

    const timerId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index++;
        if (index <= text.length) {
          setDisplayed(text.slice(0, index));
        }
        if (index >= text.length) {
          setDone(true);
          if (intervalId !== null) clearInterval(intervalId);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timerId);
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

// Primary background video source
// If you host the video file, paste its direct URL here or place it in /public/hero-video.mp4
const VIDEO_SRC = '/hero-video.mp4';
const FALLBACK_VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_041744_63efcd78-bf7d-4039-99e2-2461e8a61903.mp4';

type ModalType = 'pitch' | 'careers' | 'hello' | 'operate' | 'contact' | 'labs' | 'studio' | 'shop' | null;

export default function App() {
  const [videoSrc, setVideoSrc] = useState<string>(VIDEO_SRC);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevXRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const hasQueuedSeekRef = useRef<boolean>(false);

  // Mobile menu toggle
  const [menuOpen, setMenuOpen] = useState(false);

  // Action pill buttons visibility
  const [buttonsVisible, setButtonsVisible] = useState(false);

  // Copy feedback state
  const [copied, setCopied] = useState(false);

  // Active modal
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [formSubmitted, setFormSubmitted] = useState<string | null>(null);

  // Typewriter text
  const typewriterText = `Hello, Assalamu'alaikum...\nTerima kasih sudah berkunjung. Ruang ini berisikan sedikit tentang diriku, apa yang kamu ingin ketahui?`;
  const { displayed, done } = useTypewriter(typewriterText, 38, 600);

  // Show action pill buttons 400ms after page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setButtonsVisible(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Video scrub seek runner
  const performSeek = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const duration = video.duration;
    if (isNaN(duration) || duration <= 0) return;

    if (isSeekingRef.current) {
      hasQueuedSeekRef.current = true;
      return;
    }

    isSeekingRef.current = true;
    hasQueuedSeekRef.current = false;
    video.currentTime = targetTimeRef.current;
  }, []);

  const handleSeeked = useCallback(() => {
    isSeekingRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    if (hasQueuedSeekRef.current || Math.abs(video.currentTime - targetTimeRef.current) > 0.05) {
      hasQueuedSeekRef.current = false;
      isSeekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    }
  }, []);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      targetTimeRef.current = 0;
      video.currentTime = 0;
    }
  };

  // Mouse scrubbing on window
  useEffect(() => {
    const SENSITIVITY = 0.8;

    const handleMouseMove = (e: MouseEvent) => {
      const video = videoRef.current;
      if (!video) return;

      const currentX = e.clientX;
      if (prevXRef.current === null) {
        prevXRef.current = currentX;
        return;
      }

      const delta = currentX - prevXRef.current;
      prevXRef.current = currentX;

      const duration = video.duration || 10;
      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * duration;
      const newTarget = Math.max(0, Math.min(duration, targetTimeRef.current + timeOffset));
      targetTimeRef.current = newTarget;

      performSeek();
    };

    const handleMouseLeave = () => {
      prevXRef.current = null;
    };

    // Also support touch scrubbing for mobile users
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const video = videoRef.current;
      if (!video) return;

      const currentX = e.touches[0].clientX;
      if (prevXRef.current === null) {
        prevXRef.current = currentX;
        return;
      }

      const delta = currentX - prevXRef.current;
      prevXRef.current = currentX;

      const duration = video.duration || 10;
      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * duration;
      targetTimeRef.current = Math.max(0, Math.min(duration, targetTimeRef.current + timeOffset));

      performSeek();
    };

    const handleTouchEnd = () => {
      prevXRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [performSeek]);

  // Handle email copy
  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText('hello@mainframe.co');
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback for older browsers or permission denied
      const textArea = document.createElement('textarea');
      textArea.value = 'hello@mainframe.co';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setFormSubmitted(null);
    setMenuOpen(false);
  };

  const closeModal = () => {
    setActiveModal(null);
    setFormSubmitted(null);
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden selection:bg-white selection:text-black">
      {/* BACKGROUND VIDEO (mouse-scrub controlled) */}
      <video
        ref={videoRef}
        src={videoSrc}
        onError={() => {
          if (videoSrc !== FALLBACK_VIDEO_SRC) {
            setVideoSrc(FALLBACK_VIDEO_SRC);
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          objectFit: 'cover',
          objectPosition: '70% center',
        }}
        className="w-full h-full pointer-events-none"
        muted
        playsInline
        preload="auto"
        onSeeked={handleSeeked}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Subtle overlay scrim to guarantee WCAG readability across bright video frames */}
      <div className="fixed inset-0 z-0 bg-black/25 pointer-events-none" />

      {/* NAVBAR (fixed, z-index: 10) */}
      <header className="fixed top-0 left-0 right-0 z-10 w-full px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
        {/* Logo (left) */}
        <div className="flex items-center gap-3">
          <span
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-[21px] sm:text-[26px] tracking-tight text-white select-none"
          >
            FarisHaan®
          </span>
          <span
            aria-hidden="true"
            className="text-[25px] sm:text-[30px] text-white select-none leading-none -tracking-[0.02em]"
          >
            ✳︎
          </span>
        </div>

        {/* Desktop center heading (hidden below md) */}
        <div className="hidden md:flex items-center">
          <h1 className="text-[20px] lg:text-[23px] font-medium tracking-wide text-white uppercase select-none">
            WELCOME TO MY LANDING PAGE
          </h1>
        </div>

        {/* Desktop CTA (right, hidden below md) */}
        <div className="hidden md:block">
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              openModal('contact');
            }}
            className="text-[23px] text-white underline underline-offset-2 hover:opacity-60 transition-opacity cursor-pointer"
          >
            Updated Version
          </a>
        </div>

        {/* Mobile hamburger (visible below md) */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          className="md:hidden flex flex-col justify-center items-center gap-[5px] w-9 h-9 p-1 z-20 cursor-pointer bg-transparent border-0 focus:outline-none"
        >
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 transform origin-center ${
              menuOpen ? 'rotate-45 translate-y-[7px]' : 'rotate-0 translate-y-0'
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 ${
              menuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 transform origin-center ${
              menuOpen ? '-rotate-45 -translate-y-[7px]' : 'rotate-0 translate-y-0'
            }`}
          />
        </button>
      </header>

      {/* MOBILE OVERLAY (z-index: 9) */}
      <div
        style={{
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col justify-center items-start px-8 gap-8 transition-opacity duration-300 z-[9] md:hidden"
      >
        <a
          href="https://www.instagram.com/rieshatn_21/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
          className="text-[32px] font-medium text-white hover:opacity-70 transition-opacity text-left bg-transparent border-0 p-0"
        >
          My Instagram
        </a>
        <a
          href="https://wa.me/qr/HPGZYXE32ITGF1"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
          className="text-[32px] font-medium text-white hover:opacity-70 transition-opacity text-left bg-transparent border-0 p-0"
        >
          My WhatsApp
        </a>
        <a
          href="https://www.instagram.com/farishaan_/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
          className="text-[32px] font-medium text-white hover:opacity-70 transition-opacity text-left bg-transparent border-0 p-0"
        >
          My Channel
        </a>
        <button
          type="button"
          onClick={() => openModal('shop')}
          className="text-[32px] font-medium text-white hover:opacity-70 transition-opacity text-left bg-transparent border-0 p-0"
        >
          My Gallery
        </button>
        <button
          type="button"
          onClick={() => openModal('contact')}
          className="text-[32px] font-medium text-white underline underline-offset-4 hover:opacity-70 transition-opacity text-left bg-transparent border-0 p-0 mt-2"
        >
          Updated Version
        </button>
      </div>

      {/* HERO SECTION (z-index: 1) */}
      <main className="relative min-h-screen h-screen flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden z-[1]">
        <div className="max-w-xl relative z-10 w-full">
          {/* 1. Blurred intro label */}
          <div
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.3,
              fontWeight: 400,
              color: '#fff',
              filter: 'blur(4px)',
            }}
            className="pointer-events-none select-none mb-5 sm:mb-6"
          >
            Hey there, meet A.R.I.A,
            <br />
            Mainframe's Adaptive Response Interface Agent
          </div>

          {/* 2. Typewriter text */}
          <p
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
              fontWeight: 400,
            }}
            className="text-white mb-5 sm:mb-6 min-h-[54px] whitespace-pre-line"
          >
            {displayed}
            {!done && (
              <span
                aria-hidden="true"
                className="inline-block w-[2px] h-[1.1em] bg-white align-middle ml-[2px] animate-blink"
              />
            )}
          </p>

          {/* 3. Action pill buttons */}
          <div
            style={{
              opacity: buttonsVisible ? 1 : 0,
              transform: buttonsVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
            className="flex flex-wrap gap-y-1 items-center"
          >
            {/* White pill 1: Mobile portfolio link */}
            <a
              href="https://faristes1.my.canva.site/farisportfolio-mobile/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 'normal' }}
              className="inline-flex items-center justify-center font-normal bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              My Portfolio - Android/iPhone
            </a>

            {/* White pill 2: Portfolio link */}
            <a
              href="https://faristes1.my.canva.site/myportofolio-pc/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 'normal' }}
              className="inline-flex items-center justify-center font-normal bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              My Portfolio - iOS/Windows
            </a>

            {/* White pill: Disclaimer From Me */}
            <button
              type="button"
              onClick={() => openModal('operate')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Disclaimer From Me
            </button>

            {/* Instagram link pill */}
            <a
              href="https://www.instagram.com/rieshatn_21/"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Instagram @rieshatn_21"
              className="group inline-flex items-center justify-center text-white bg-transparent border border-white rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer gap-2 sm:gap-3 hover:bg-white hover:text-black transition-colors duration-200"
            >
              <span>
                Visit My Instagram:{' '}
                <span className="underline underline-offset-1">
                  @rieshatn_21
                </span>
              </span>
              {/* 12x12 Instagram icon */}
              <span className="inline-flex items-center justify-center shrink-0">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </span>
            </a>
          </div>
        </div>
      </main>

      {/* Copy notification badge */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-xs font-medium shadow-2xl transition-all duration-300 ${
          copied ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
        }`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-black"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Email copied to clipboard (hello@mainframe.co)</span>
      </div>

      {/* MODAL DIALOGS FOR INTERACTIVE PILL BUTTONS & NAV LINKS */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                {activeModal !== 'contact' && (
                  <span className={`text-xs ${activeModal === 'shop' ? 'normal-case' : 'uppercase'} tracking-wider text-neutral-400 font-mono`}>
                    {activeModal === 'shop' ? 'My Gallery' : `Mainframe / ${activeModal.toUpperCase()}`}
                  </span>
                )}
                <h2 className="text-2xl font-medium tracking-tight mt-1 text-white">
                  {activeModal === 'pitch' && 'Pitch us an idea'}
                  {activeModal === 'careers' && 'Join the Mainframe studio'}
                  {activeModal === 'hello' && 'Send a brief hello'}
                  {activeModal === 'operate' && 'Disclaimer From Me'}
                  {activeModal === 'contact' && 'Updated Version'}
                  {activeModal === 'labs' && 'Mainframe Labs'}
                  {activeModal === 'studio' && 'Studio Practice'}
                  {activeModal === 'shop' && 'Potret Kenangan'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close dialog"
                className="text-neutral-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal body content */}
            {formSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h3 className="text-lg font-medium">Transmission Received</h3>
                <p className="text-neutral-400 text-sm max-w-sm mx-auto">
                  {formSubmitted}
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-4 px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
                >
                  Return to viewport
                </button>
              </div>
            ) : (
              <>
                {activeModal === 'pitch' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setFormSubmitted('A.R.I.A has routed your brief to our creative partners. Expect an initial reaction within 24 hours.');
                    }}
                    className="space-y-4"
                  >
                    <p className="text-neutral-300 text-sm">
                      Have a vision that blurs machine intelligence, spatial presence, or breakthrough digital craft? Tell us what you are imagining.
                    </p>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase tracking-wide">Your Email</label>
                      <input
                        required
                        type="email"
                        placeholder="alex@company.com"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase tracking-wide">Project Scope</label>
                      <select className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors">
                        <option>Brand Identity & Kinetic Systems</option>
                        <option>Autonomous / AI Interface Design</option>
                        <option>Full-Stack Interactive Experience</option>
                        <option>Experimental R&D Prototype</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase tracking-wide">What are we building?</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Give us the premise, constraints, or ambition..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
                      >
                        Send Pitch
                      </button>
                    </div>
                  </form>
                )}

                {activeModal === 'careers' && (
                  <div className="space-y-4">
                    <p className="text-neutral-300 text-sm">
                      We operate in small, multidisciplinary squads of systems thinkers, creative coders, and art directors.
                    </p>
                    <div className="space-y-2">
                      {[
                        { title: 'Principal Creative Technologist', loc: 'Tokyo / Remote', tag: 'WebGL / Shaders / React' },
                        { title: 'Interactive Art Director', loc: 'Berlin / Hybrid', tag: 'Brand / Kinetic / Editorial' },
                        { title: 'Systems Interface Engineer', loc: 'San Francisco / Remote', tag: 'TypeScript / Rust / Agentic UX' },
                      ].map((job) => (
                        <div
                          key={job.title}
                          className="p-3.5 rounded-xl border border-neutral-800/80 bg-neutral-900/60 hover:border-neutral-700 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-medium text-white">{job.title}</div>
                            <div className="text-xs text-neutral-400 mt-0.5">{job.loc} · {job.tag}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormSubmitted(`Thank you for expressing interest in ${job.title}. Please send your portfolio index to careers@mainframe.co.`);
                            }}
                            className="text-xs px-3 py-1.5 rounded-full border border-neutral-700 hover:border-white hover:bg-white hover:text-black transition-all"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-500 pt-2 text-center">
                      Don't see your discipline? Send spontaneous portfolios to{' '}
                      <span className="text-white underline underline-offset-1">work@mainframe.co</span>
                    </p>
                  </div>
                )}

                {activeModal === 'hello' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setFormSubmitted('A.R.I.A logged your note. We love spontaneous connections and will write back promptly.');
                    }}
                    className="space-y-4"
                  >
                    <p className="text-neutral-300 text-sm">
                      Drop us a line just to say hi, share something inspiring, or ask about our latest open-source research.
                    </p>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase tracking-wide">Your Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Morgan Reese"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase tracking-wide">Your Email</label>
                      <input
                        required
                        type="email"
                        placeholder="morgan@domain.com"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase tracking-wide">Message</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="What's on your mind?"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
                      >
                        Say Hello
                      </button>
                    </div>
                  </form>
                )}

                {activeModal === 'operate' && (
                  <div className="space-y-4">
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      ‘Akan selalu ada asumsi tentang kita dari orang-orang yang tidak kita kenal, atau bahkan orang yang kita kenal sekalipun. Dan itu adalah harga yang harus kamu bayar untuk mendapat privilege baru karena kamu tidak pernah menjual kehidupan pribadimu selain hasil usahamu.’
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {[
                        { num: '01', title: 'Zero Bloat', desc: 'Tidak semua orang akan bahagia dan nyaman di saat melihat atau mengetahui kehidupan detail pribadi seseorang, atau bahkan sekelumitnya saja.' },
                        { num: '02', title: 'Tactile Motion', desc: 'Pada umumnya, manusia akan lebih melihat kepada apa yang sudah kita miliki, bukan pada apa yang kita perjuangkan.' },
                      ].map((item) => (
                        <div key={item.num} className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/50">
                          <span className="text-xs font-mono text-neutral-400">{item.num}</span>
                          <h4 className="text-sm font-medium text-white mt-1">{item.title}</h4>
                          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeModal === 'contact' && (
                  <div className="space-y-5">
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      Ini adalah versi update dari web dan portofolio, 2 digit pertama adalah tanggal dan 2 digit setelahnya adalah bulan
                    </p>
                    <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900 flex items-center">
                      <div className="text-base font-semibold text-white font-mono tracking-wide">
                        V.01.10
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'labs' && (
                  <div className="space-y-4">
                    <p className="text-neutral-300 text-sm">
                      Our internal experimental wing exploring the intersection of generative shaders, browser runtime kernels, and autonomous interface agents like A.R.I.A.
                    </p>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                        <span className="text-xs font-mono text-neutral-400">EXP // 09</span>
                        <div className="text-sm font-medium text-white">Dynamic Latent Video Scrubbing Kernel</div>
                        <p className="text-xs text-neutral-400 mt-0.5">Horizontal cursor velocity mapping with sub-frame seek interpolation.</p>
                      </div>
                      <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
                        <span className="text-xs font-mono text-neutral-400">EXP // 08</span>
                        <div className="text-sm font-medium text-white">A.R.I.A Adaptive Persona Model</div>
                        <p className="text-xs text-neutral-400 mt-0.5">Context-aware conversational routing for creative agencies.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'studio' && (
                  <div className="space-y-4">
                    <p className="text-neutral-300 text-sm">
                      Selected partner engagements spanning luxury automotive, spatial computing, computational identity, and high-frequency fintech.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900">
                        <span className="text-white font-medium block">Kinetix Mobility</span>
                        <span className="text-neutral-400">Digital Cockpit Operating System</span>
                      </div>
                      <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900">
                        <span className="text-white font-medium block">Vanguard Space</span>
                        <span className="text-neutral-400">Orbital Telemetry Visualizer</span>
                      </div>
                      <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900">
                        <span className="text-white font-medium block">Neue Sound</span>
                        <span className="text-neutral-400">Generative Spatial Audio Interface</span>
                      </div>
                      <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900">
                        <span className="text-white font-medium block">Aura Fragrances</span>
                        <span className="text-neutral-400">Synesthetic Digital Flagship</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'shop' && (
                  <div className="space-y-4">
                    <p className="text-neutral-300 text-sm">
                      Belum tersedia dan masih tahap penyempurnaan
                    </p>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">Oktober ini....</div>
                          <div className="text-xs text-neutral-400">Semoga selalu sehat dalam iman dan kebahagiaan serta bermanfaat untuk diri dan orang lain</div>
                        </div>
                        <span className="text-xs text-neutral-400 font-mono">Amiin</span>
                      </div>
                      <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">Oktober ini....</div>
                          <div className="text-xs text-neutral-400">Dimudahkan dalam segala kebaikan dan mendapat apa yang diinginkan</div>
                        </div>
                        <span className="text-xs text-neutral-400 font-mono">Amiin</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
