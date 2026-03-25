import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { MedicalRecord } from '../../types';

export default function MedicalRecords() {
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchRecords(token);
  }, [router]);

  const fetchRecords = async (token: string) => {
    try {
      const response = await fetch('/api/records', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      setRecords(data.records);
    } catch {
      setError('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('Lab')) return '🔬';
    if (type.includes('Radiology') || type.includes('X-Ray')) return '🩻';
    if (type.includes('Prescription')) return '💊';
    return '📋';
  };

  return (
    <>
      <Head>
        <title>Patient Portal - Medical Records</title>
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
                  <Link href="/records" className="text-blue-600 font-medium">Records</Link>
                  <Link href="/messages" className="text-gray-500 hover:text-gray-900">Messages</Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Medical Records</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">All Records</h2>
                </div>
                {loading ? (
                  <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
                ) : records.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No records found</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {records.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => setSelectedRecord(record)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedRecord?.id === record.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getTypeIcon(record.type)}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{record.type}</p>
                            <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400">{record.provider}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedRecord ? (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <span className="text-3xl">{getTypeIcon(selectedRecord.type)}</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedRecord.type}</h2>
                      <p className="text-gray-500 text-sm">{selectedRecord.provider} &bull; {new Date(selectedRecord.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedRecord.diagnosis && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Diagnosis</h3>
                        <p className="text-gray-900">{selectedRecord.diagnosis}</p>
                      </div>
                    )}

                    {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Medications</h3>
                        <ul className="space-y-1">
                          {selectedRecord.medications.map((med, i) => (
                            <li key={i} className="flex items-center text-gray-900">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                              {med}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</h3>
                      <p className="text-gray-900">{selectedRecord.notes}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      This record is encrypted and access is logged for HIPAA compliance
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">Select a record to view details</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
