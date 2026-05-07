import React, { useState, useRef, useEffect } from 'react'
import { BOT_TREE } from './chatbotData.js'

const BRAND = '#0052CC'
const BRAND_DARK = '#0747A6'
const BRAND_LIGHT = '#DEEBFF'

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState([])
  const [nodeId, setNodeId] = useState('root')
  const [stack, setStack] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [unread, setUnread] = useState(1)
  const messagesEndRef = useRef(null)
  const hasGreeted = useRef(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Greet on first open
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true
      setUnread(0)
      deliverBotMessage('root')
    }
    if (isOpen) setUnread(0)
  }, [isOpen])

  function deliverBotMessage(id, delay = 300) {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const node = BOT_TREE[id]
      if (!node) return
      setMessages(m => [...m, { type: 'bot', text: node.message, options: node.options, nodeId: id }])
    }, delay)
  }

  function handleOption(option) {
    // Echo user's choice
    setMessages(m => [...m, { type: 'user', text: option.label }])
    setStack(s => [...s, nodeId])
    setNodeId(option.next)
    deliverBotMessage(option.next)
  }

  function handleBack() {
    if (stack.length === 0) return
    const prev = stack[stack.length - 1]
    setStack(s => s.slice(0, -1))
    setNodeId(prev)
    setMessages(m => [...m, { type: 'user', text: '← Back' }])
    deliverBotMessage(prev, 200)
  }

  function handleReset() {
    setMessages([])
    setStack([])
    setNodeId('root')
    deliverBotMessage('root', 200)
  }

  const w = isExpanded ? 440 : 360
  const h = isExpanded ? 580 : 460

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 52, height: 52, borderRadius: '50%',
            background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
            border: 'none', cursor: 'pointer', color: '#fff',
            boxShadow: '0 4px 16px rgba(0,82,204,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          title="Open help chat"
        >
          <ChatIcon />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              background: '#FF5630', color: '#fff', borderRadius: '50%',
              width: 18, height: 18, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
            }}>
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: w, height: h,
            display: 'flex', flexDirection: 'column',
            borderRadius: 14,
            boxShadow: '0 8px 40px rgba(9,30,66,0.28)',
            background: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            overflow: 'hidden',
            transition: 'width 0.2s, height 0.2s',
          }}
        >
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <BotIcon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>BahnBot</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1 }}>Help Center • Always here</div>
            </div>
            <button
              onClick={() => setIsExpanded(v => !v)}
              style={headerBtn}
              title={isExpanded ? 'Shrink' : 'Expand'}
            >
              {isExpanded ? <ShrinkIcon /> : <ExpandIcon />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={headerBtn}
              title="Close"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 12px',
            display: 'flex', flexDirection: 'column', gap: 8,
            background: '#F7F8FA',
          }}>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.type === 'bot' ? (
                  <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 2,
                    }}>
                      <BotIcon size={13} />
                    </div>
                    <div style={{ maxWidth: '82%' }}>
                      <div style={{
                        background: '#fff', border: '1px solid #E8EAED',
                        borderRadius: '0 10px 10px 10px',
                        padding: '9px 12px', fontSize: 12.5, color: '#172B4D',
                        lineHeight: 1.55, boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        whiteSpace: 'pre-line',
                      }}>
                        <FormattedText text={msg.text} />
                      </div>
                      {/* Options chips */}
                      {msg.options && msg.options.length > 0 && i === messages.length - 1 && !isTyping && (
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {msg.options.map(opt => (
                            <button
                              key={opt.next}
                              onClick={() => handleOption(opt)}
                              style={{
                                padding: '5px 11px', fontSize: 11.5, cursor: 'pointer',
                                borderRadius: 20, border: `1.5px solid ${BRAND}`,
                                color: BRAND, background: '#fff', fontWeight: 500,
                                transition: 'background 0.12s, color 0.12s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = BRAND_LIGHT }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{
                      background: BRAND, color: '#fff',
                      borderRadius: '10px 10px 0 10px',
                      padding: '8px 12px', fontSize: 12.5,
                      maxWidth: '75%', lineHeight: 1.4,
                    }}>
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BotIcon size={13} />
                </div>
                <div style={{
                  background: '#fff', border: '1px solid #E8EAED',
                  borderRadius: '0 10px 10px 10px',
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#B0B8C9',
                      animation: 'botdot 1.2s infinite',
                      animationDelay: `${i * 0.2}s`,
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer actions */}
          <div style={{
            padding: '8px 12px', background: '#fff',
            borderTop: '1px solid #EBECF0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <button
              onClick={handleBack}
              disabled={stack.length === 0}
              style={{
                ...footerBtn,
                opacity: stack.length === 0 ? 0.35 : 1,
                cursor: stack.length === 0 ? 'default' : 'pointer',
              }}
            >
              ← Back
            </button>
            <span style={{ fontSize: 10.5, color: '#97A0AF' }}>Powered by bahnOS</span>
            <button onClick={handleReset} style={footerBtn}>
              ↺ Start over
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes botdot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  )
}

// Render **bold** markdown inline
function FormattedText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} style={{ fontWeight: 600 }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const headerBtn = {
  width: 28, height: 28, borderRadius: 6,
  background: 'rgba(255,255,255,0.15)', border: 'none',
  cursor: 'pointer', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, padding: 0,
}

const footerBtn = {
  padding: '4px 10px', fontSize: 11.5, borderRadius: 6,
  border: '1px solid #DFE1E6', background: 'none',
  color: '#5E6C84', cursor: 'pointer', fontWeight: 500,
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function BotIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <line x1="12" y1="7" x2="12" y2="11"/>
      <line x1="8" y1="15" x2="8" y2="15" strokeWidth="2.5"/>
      <line x1="16" y1="15" x2="16" y2="15" strokeWidth="2.5"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  )
}

function ShrinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
      <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
    </svg>
  )
}
