'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, X } from 'lucide-react'
import { authFetch, getAuthHeaders } from '@/lib/authFetch'
import { useAuthStore } from '@/stores/useAuthStore'

interface Message {
    id: number
    sender_id: number
    receiver_id: number
    property_id: number
    message: string
    is_read: boolean
    created_at: string
    sender_name?: string
}

interface ChatboxProps {
    propertyId: number
    receiverId: number
    receiverName: string
    onClose: () => void
}

export default function Chatbox({ propertyId, receiverId, receiverName, onClose }: ChatboxProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const { currentUser } = useAuthStore()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Fetch messages History
    const fetchMessages = async () => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/messages/${receiverId}/${propertyId}`, {
                headers: getAuthHeaders()
            })
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
                
                // Mark as read
                await authFetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/messages/read/${receiverId}/${propertyId}`, {
                    method: 'PATCH',
                    headers: getAuthHeaders()
                })
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Polling every 3 seconds
    useEffect(() => {
        fetchMessages()
        const intervalId = setInterval(fetchMessages, 3000)
        return () => clearInterval(intervalId)
    }, [propertyId, receiverId])

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return

        setIsSending(true)
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    receiver_id: receiverId,
                    property_id: propertyId,
                    message: newMessage.trim()
                })
            })

            if (res.ok) {
                const sentMessage = await res.json()
                setMessages((prev) => [...prev, sentMessage])
                setNewMessage('')
            }
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Card className="fixed bottom-4 right-4 w-96 shadow-2xl z-50 flex flex-col border-emerald-500 dark:border-emerald-600 dark:bg-slate-900 h-[32rem]">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex flex-row items-center justify-between p-4 rounded-t-xl py-3 border-b-0 space-y-0">
                <CardTitle className="text-md flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>แชทกับ {receiverName}</span>
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 h-8 w-8">
                    <X className="w-5 h-5" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full text-slate-500">
                        กำลังโหลดข้อความ...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-400 text-sm">
                        เริ่มการสนทนา...
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser?.id
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none shadow-md' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'}`}>
                                    {msg.message}
                                    <div className={`text-[10px] mt-1 ${isMe ? 'text-emerald-100 flex justify-end gap-1' : 'text-slate-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && msg.is_read && <span className="text-blue-200 text-[10px]">อ่านแล้ว</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            <CardFooter className="p-3 bg-white dark:bg-slate-900 border-t items-end gap-2">
                <Textarea 
                    placeholder="พิมพ์ข้อความ..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                        }
                    }}
                    className="min-h-10 max-h-32 resize-none rounded-xl"
                />
                <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()} size="icon" className="h-10 w-10 shrink-0 bg-emerald-600 hover:bg-emerald-700 rounded-full">
                    {isSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send className="w-4 h-4" />}
                </Button>
            </CardFooter>
        </Card>
    )
}
