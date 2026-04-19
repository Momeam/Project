'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Building2, MessageCircle, Send, User, ChevronRight, ArrowLeft } from 'lucide-react'
import { authFetch, getAuthHeaders } from '@/lib/authFetch'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'

interface Conversation {
    id: number
    sender_id: number
    receiver_id: number
    property_id: number
    message: string
    is_read: boolean
    created_at: string
    other_name: string
    other_role: string
    other_user_id: number
    property_title: string
}

interface Message {
    id: number
    sender_id: number
    receiver_id: number
    property_id: number
    message: string
    is_read: boolean
    created_at: string
}

export default function InboxPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [loading, setLoading] = useState(true)

    const { currentUser } = useAuthStore()
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const fetchConversations = async () => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/messages/conversations`, {
                headers: getAuthHeaders()
            })
            if (res.ok) {
                const data = await res.json()
                setConversations(data)
            }
        } catch (error) {
            console.error('Error fetching conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (otherUserId: number, propertyId: number) => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/messages/${otherUserId}/${propertyId}`, {
                headers: getAuthHeaders()
            })
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
                
                // Mark as read
                await authFetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/messages/read/${otherUserId}/${propertyId}`, {
                    method: 'PATCH',
                    headers: getAuthHeaders()
                })
                
                // Update local conversation is_read if it was unread and we are receiving it
                setConversations(prev => prev.map(c => {
                    if (c.other_user_id === otherUserId && c.property_id === propertyId && c.receiver_id === currentUser?.id) {
                        return { ...c, is_read: true }
                    }
                    return c
                }))
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    useEffect(() => {
        if (!currentUser) {
            router.push('/login')
            return
        }
        fetchConversations()
        
        // Polling conversations list
        const intervalId = setInterval(fetchConversations, 5000)
        return () => clearInterval(intervalId)
    }, [currentUser, router])

    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv.other_user_id, selectedConv.property_id)
            const intervalId = setInterval(() => {
                fetchMessages(selectedConv.other_user_id, selectedConv.property_id)
            }, 3000)
            return () => clearInterval(intervalId)
        }
    }, [selectedConv])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConv) return

        setIsSending(true)
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    receiver_id: selectedConv.other_user_id,
                    property_id: selectedConv.property_id,
                    message: newMessage.trim()
                })
            })

            if (res.ok) {
                const sentMessage = await res.json()
                setMessages((prev) => [...prev, sentMessage])
                setNewMessage('')
                fetchConversations() // Update sidebar with new message preview
            }
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsSending(false)
        }
    }

    if (loading) {
        return <div className="flex h-[80vh] items-center justify-center">กำลังโหลดข้อมูล...</div>
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl mt-24">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
                </button>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <MessageCircle className="w-8 h-8 text-emerald-500" />
                    กล่องข้อความ
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
                {/* Sidebar (Conversations List) */}
                <Card className="col-span-1 flex flex-col overflow-hidden h-full">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b font-medium text-slate-800 dark:text-slate-200">
                        รายการสนทนา
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                ไม่มีประวัติการสนทนา
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div 
                                    key={`${conv.other_user_id}-${conv.property_id}`}
                                    onClick={() => setSelectedConv(conv)}
                                    className={`p-4 border-b cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${selectedConv?.other_user_id === conv.other_user_id && selectedConv?.property_id === conv.property_id ? 'bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-full">
                                                <User className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{conv.other_name}</div>
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">({conv.other_role})</div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(conv.created_at).toLocaleDateString('th-TH')}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 line-clamp-1">
                                        <Building2 className="w-3 h-3" />
                                        {conv.property_title}
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-sm text-slate-500 truncate max-w-[85%]">
                                            {conv.sender_id === currentUser?.id ? 'คุณ: ' : ''}{conv.message}
                                        </p>
                                        {!conv.is_read && conv.receiver_id === currentUser?.id && (
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Main Chat Area */}
                <Card className="col-span-1 md:col-span-2 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
                    {selectedConv ? (
                        <>
                            <div className="bg-white dark:bg-slate-900 border-b p-4 flex items-center justify-between shadow-sm z-10">
                                <div>
                                    <h2 className="font-bold flex items-center gap-2 text-lg">
                                        {selectedConv.other_name} <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{selectedConv.other_role}</span>
                                    </h2>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 cursor-pointer hover:underline" onClick={() => router.push(`/listings/${selectedConv.property_id}`)}>
                                        <Building2 className="w-4 h-4" />
                                        {selectedConv.property_title}
                                        <ChevronRight className="w-3 h-3" />
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser?.id
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl p-4 text-sm shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
                                                <div className="whitespace-pre-wrap">{msg.message}</div>
                                                <div className={`text-[10px] mt-2 ${isMe ? 'text-emerald-100 flex justify-end gap-1' : 'text-slate-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && msg.is_read && <span className="text-blue-200 text-[10px] ml-1">อ่านแล้ว</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-white dark:bg-slate-900 border-t flex gap-2">
                                <Textarea 
                                    placeholder="พิมพ์ข้อความ..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="resize-none min-h-12 max-h-32"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage()
                                        }
                                    }}
                                />
                                <Button 
                                    onClick={handleSendMessage} 
                                    disabled={isSending || !newMessage.trim()} 
                                    className="bg-emerald-600 hover:bg-emerald-700 h-auto px-6 rounded-xl self-end mb-1"
                                >
                                    {isSending ? 'กำลังส่ง...' : <><Send className="w-4 h-4 mr-2" /> ส่ง</>}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white dark:bg-slate-900 h-full">
                            <MessageCircle className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-700" />
                            <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">เลือกรายการสนทนา</h2>
                            <p className="mt-2 text-sm max-w-sm">เลือกรายการจากแถบด้านซ้ายเพื่อดูหรือส่งข้อความถึงผู้ขายหรือผู้ซื้อของคุณ</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
