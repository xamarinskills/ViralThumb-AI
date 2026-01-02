
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const DiagnosticPage: React.FC = () => {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, email, created_at')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProfiles(data || []);
            } catch (err) {
                console.error("Diagnostic fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    return (
        <div className="p-10 bg-background min-h-screen text-white">
            <h1 className="text-3xl font-black mb-8">Database Diagnostic</h1>
            {loading ? <p>Loading profiles...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-white/10">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="p-4 border border-white/10 text-left">Username</th>
                                <th className="p-4 border border-white/10 text-left">Email</th>
                                <th className="p-4 border border-white/10 text-left">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map(p => (
                                <tr key={p.id} className="hover:bg-white/5">
                                    <td className="p-4 border border-white/10">{p.username}</td>
                                    <td className="p-4 border border-white/10">{p.email}</td>
                                    <td className="p-4 border border-white/10">{new Date(p.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {profiles.length === 0 && <p className="mt-4 text-text-secondary">No profiles found.</p>}
                </div>
            )}
        </div>
    );
};

export default DiagnosticPage;
