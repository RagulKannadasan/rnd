import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Assuming firebase is configured and db is exported from this path
import { collection, addDoc } from 'firebase/firestore';
import firebaseService from '../../services/firebaseService';
import './ManageEvents.css';

const ManageEvents = () => {
    const [upcomingEvent, setUpcomingEvent] = useState({
        name: '',
        date: '',
        description: '',
        location: ''
    });

    const [pastEvent, setPastEvent] = useState({
        name: '',
        date: '',
        description: '',
        imageUrl: '' // Changed from image: null
    });

    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        const upcoming = await firebaseService.getUpcomingEvents();
        const past = await firebaseService.getPastEvents();
        setUpcomingEvents(upcoming);
        setPastEvents(past);
    };

    const handleUpcomingChange = (e) => {
        setUpcomingEvent({ ...upcomingEvent, [e.target.name]: e.target.value });
    };

    const handlePastChange = (e) => {
        // Directly update the state for imageUrl
        setPastEvent({ ...pastEvent, [e.target.name]: e.target.value });
    };

    const handleUpcomingSubmit = async (e) => {
        e.preventDefault();
        if (!upcomingEvent.name || !upcomingEvent.date) {
            alert('Please fill out at least the name and date for the upcoming event.');
            return;
        }
        try {
            await addDoc(collection(db, 'upcomingEvents'), upcomingEvent);
            alert('Upcoming event added successfully!');
            setUpcomingEvent({ name: '', date: '', description: '', location: '' });
            fetchEvents();
        } catch (error) {
            console.error('Error adding upcoming event: ', error);
            alert('Failed to add upcoming event.');
        }
    };

    const handlePastSubmit = async (e) => {
        e.preventDefault();
        // Check for imageUrl instead of image file
        if (!pastEvent.name || !pastEvent.date || !pastEvent.imageUrl) {
            alert('Please fill out all fields for the past event, including the Image URL.');
            return;
        }
        console.log('Submitting past event:', pastEvent);
        try {
            // No image upload needed, directly use imageUrl from state
            const dataToUpload = {
                ...pastEvent
            };
            console.log('Data to upload to Firestore:', dataToUpload);
            await addDoc(collection(db, 'pastEvents'), dataToUpload);
            alert('Past event added successfully!');
            setPastEvent({ name: '', date: '', description: '', imageUrl: '' }); // Reset imageUrl
            fetchEvents();
        } catch (error) {
            console.error('Error adding past event: ', error);
            alert('Failed to add past event.');
        }
    };

    const handleDeleteUpcoming = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this upcoming event?')) {
            try {
                await firebaseService.deleteUpcomingEvent(eventId);
                alert('Upcoming event deleted successfully!');
                fetchEvents();
            } catch (error) {
                console.error('Error deleting upcoming event: ', error);
                alert('Failed to delete upcoming event.');
            }
        }
    };

    const handleDeletePast = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this past event?')) {
            try {
                await firebaseService.deletePastEvent(eventId);
                alert('Past event deleted successfully!');
                fetchEvents();
            } catch (error) {
                console.error('Error deleting past event: ', error);
                alert('Failed to delete past event.');
            }
        }
    };

    const handleEdit = (event, type) => {
        setEditingEvent({ ...event, type });
        setIsEditing(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const { type, id, ...data } = editingEvent;
        try {
            if (type === 'upcoming') {
                await firebaseService.updateUpcomingEvent(id, data);
            } else {
                await firebaseService.updatePastEvent(id, data);
            }
            alert('Event updated successfully!');
            setIsEditing(false);
            setEditingEvent(null);
            fetchEvents();
        } catch (error) {
            console.error('Error updating event: ', error);
            alert('Failed to update event.');
        }
    };

    const formatDateForDisplay = (date) => {
        if (date && date.seconds) {
            return new Date(date.seconds * 1000).toLocaleDateString();
        }
        if (typeof date === 'string') {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString();
            }
        }
        return date;
    };

    const formatDateForInput = (date) => {
        if (!date) return '';
        let d;
        if (date.seconds) {
            d = new Date(date.seconds * 1000);
        } else if (typeof date === 'string') {
            d = new Date(date);
        } else {
            return '';
        }

        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <div className="manage-events">
            <h2>Manage Events</h2>
            <div className="event-forms">
                <div className="form-container">
                    <h3>Add Upcoming Event</h3>
                    <form onSubmit={handleUpcomingSubmit}>
                        <input type="text" name="name" value={upcomingEvent.name} onChange={handleUpcomingChange} placeholder="Event Name" required />
                        <input type="date" name="date" value={upcomingEvent.date} onChange={handleUpcomingChange} required />
                        <textarea name="description" value={upcomingEvent.description} onChange={handleUpcomingChange} placeholder="Description"></textarea>
                        <input type="text" name="location" value={upcomingEvent.location} onChange={handleUpcomingChange} placeholder="Location" />
                        <button type="submit">Add Upcoming Event</button>
                    </form>
                </div>
                <div className="form-container">
                    <h3>Add Past Event</h3>
                    <form onSubmit={handlePastSubmit}>
                        <input type="text" name="name" value={pastEvent.name} onChange={handlePastChange} placeholder="Event Name" required />
                        <input type="date" name="date" value={pastEvent.date} onChange={handlePastChange} required />
                        <textarea name="description" value={pastEvent.description} onChange={handlePastChange} placeholder="Description"></textarea>
                        {/* Changed to text input for Image URL */}
                        <input type="text" name="imageUrl" value={pastEvent.imageUrl} onChange={handlePastChange} placeholder="Image URL" required />
                        <button type="submit">Add Past Event</button>
                    </form>
                </div>
            </div>

            <div className="events-list">
                <h3>Upcoming Events</h3>
                <ul>
                    {upcomingEvents.map(event => (
                        <li key={event.id}>
                            {event.name} - {formatDateForDisplay(event.date)}
                            <button onClick={() => handleEdit(event, 'upcoming')}>Edit</button>
                            <button onClick={() => handleDeleteUpcoming(event.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="events-list">
                <h3>Past Events</h3>
                <ul>
                    {pastEvents.map(event => (
                        <li key={event.id}>
                            {event.name} - {formatDateForDisplay(event.date)}
                            {event.imageUrl && <img src={event.imageUrl} alt={event.name} style={{ width: '50px', height: '50px', objectFit: 'cover', marginLeft: '10px' }} />}
                            <button onClick={() => handleEdit(event, 'past')}>Edit</button>
                            <button onClick={() => handleDeletePast(event.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </div>

            {isEditing && editingEvent && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Edit Event</h3>
                        <form onSubmit={handleUpdate}>
                            <input type="text" name="name" value={editingEvent.name} onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })} placeholder="Event Name" required />
                            <input type="date" name="date" value={formatDateForInput(editingEvent.date)} onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })} required />
                            <textarea name="description" value={editingEvent.description} onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })} placeholder="Description"></textarea>
                            {editingEvent.type === 'upcoming' && (
                                <input type="text" name="location" value={editingEvent.location} onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })} placeholder="Location" />
                            )}
                            {/* Add imageUrl field to edit modal for past events */}
                            {editingEvent.type === 'past' && (
                                <input type="text" name="imageUrl" value={editingEvent.imageUrl} onChange={(e) => setEditingEvent({ ...editingEvent, imageUrl: e.target.value })} placeholder="Image URL" />
                            )}
                            <button type="submit">Update Event</button>
                            <button onClick={() => setIsEditing(false)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageEvents;