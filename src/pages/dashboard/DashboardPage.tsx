import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileApi, servicesApi } from '../../services/api.service';
import type { Profile, Service } from '../../types/api.types';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<Profile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [familyRes, servicesRes] = await Promise.all([
          profileApi.getFamily(),
          servicesApi.list()
        ]);
        setFamilyMembers(familyRes.profiles);
        setServices(servicesRes.services);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {user?.first_name}!</h1>
        <button onClick={logout} className="logout-button">Logout</button>
      </header>

      <section className="dashboard-section">
        <h2>My Profile</h2>
        <div className="profile-card">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Mobile:</strong> {user?.mobile || 'N/A'}</p>
          <p><strong>RCEB Status:</strong> {user?.rceb_flag ? 'Active' : 'None'}</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Family Members</h2>
        <div className="grid">
          {familyMembers.map((member) => (
            <div key={member.id} className="card">
              <h3>{member.first_name} {member.last_name}</h3>
              <p>DOB: {new Date(member.date_of_birth).toLocaleDateString()}</p>
              <p>{member.parent_profile_id ? 'Child' : 'Parent'}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Available Services</h2>
        <div className="grid">
           {services.map(service => (
             <div key={service.id} className="card">
               <h3>{service.name}</h3>
               <p>{service.description}</p>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
};
