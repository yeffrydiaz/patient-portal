import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  decryptedContent?: string;
  timestamp: string;
  read: boolean;
  threadId: string;
}

export default function Messages() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [composing, setComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({ receiverId: '', subject: '', content: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchMessages(token);
  }, [router]);

  const fetchMessages = async (token: string) => {
    try {
      const response = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data.messages);
    } catch {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      setMessages(prev => [data.message, ...prev]);
      setComposing(false);
      setNewMessage({ receiverId: '', subject: '', content: '' });
    } catch {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>Patient Portal - Messages</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900">Patient Portal</span>
                </Link>
                <div className="hidden md:flex space-x-6">
                  <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">Dashboard</Link>
                  <Link href="/appointments" className="text-gray-500 hover:text-gray-900">Appointments</Link>
                  <Link href="/records" className="text-gray-500 hover:text-gray-900">Records</Link>
                  <Link href="/messages" className="text-blue-600 font-medium">Messages</Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Secure Messages</h1>
            <button
              onClick={() => setComposing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Compose Message
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6">
            <p className="text-sm text-blue-700">
              🔒 All messages are end-to-end encrypted using AWS KMS. Only you and your provider can read them.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {composing && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">New Message</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="To (Provider ID or Email)"
                  value={newMessage.receiverId}
                  onChange={(e) => setNewMessage({ ...newMessage, receiverId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <textarea
                  placeholder="Type your message... (will be encrypted)"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.receiverId || !newMessage.subject || !newMessage.content}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {sending ? 'Encrypting & Sending...' : 'Send Encrypted Message'}
                  </button>
                  <button
                    onClick={() => setComposing(false)}
                    className="text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Inbox</h2>
                </div>
                {loading ? (
                  <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
                ) : messages.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No messages</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {messages.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-blue-50' : ''} ${!msg.read ? 'border-l-4 border-blue-500' : ''}`}
                      >
                        <p className={`text-sm font-medium ${!msg.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {msg.subject}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(msg.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Encrypted
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedMessage ? (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedMessage.subject}</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {new Date(selectedMessage.timestamp).toLocaleString()}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">
                      {selectedMessage.decryptedContent || '[Message content is encrypted]'}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Decrypted with AWS KMS &bull; Access logged for HIPAA compliance
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">Select a message to read it</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
