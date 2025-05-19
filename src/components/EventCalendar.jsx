import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit, Search } from 'lucide-react';

const EventCalendar = () => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventList, setShowEventList] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [eventForm, setEventForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    description: '',
    color: '#4A90E2'
  });

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // Save events to localStorage when they change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  // Calendar Logic
  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Event Handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowEventList(true);
  };

  const handleAddEvent = () => {
    if (!selectedDate || !eventForm.name || !eventForm.startTime || !eventForm.endTime) return;

    const dateKey = formatDate(selectedDate);
    const newEvent = {
      id: Date.now(),
      ...eventForm,
      date: dateKey
    };

    // Check for overlapping events
    const dateEvents = events[dateKey] || [];
    const hasOverlap = dateEvents.some(event => {
      return (
        (eventForm.startTime >= event.startTime && eventForm.startTime < event.endTime) ||
        (eventForm.endTime > event.startTime && eventForm.endTime <= event.endTime)
      );
    });

    if (hasOverlap) {
      alert('This time slot overlaps with an existing event!');
      return;
    }

    setEvents(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEvent]
    }));

    setEventForm({
      name: '',
      startTime: '',
      endTime: '',
      description: '',
      color: '#4A90E2'
    });
    setShowEventModal(false);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEventForm({
      name: event.name,
      startTime: event.startTime,
      endTime: event.endTime,
      description: event.description || '',
      color: event.color
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    if (!selectedDate) return;
    const dateKey = formatDate(selectedDate);
    setEvents(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(event => event.id !== eventId)
    }));
  };

  const exportEvents = () => {
    const eventsJson = JSON.stringify(events, null, 2);
    const blob = new Blob([eventsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-events-${formatDate(currentDate)}.json`;
    a.click();
  };

  // Filter events based on search term
  const filteredEvents = (dateKey) => {
    if (!events[dateKey]) return [];
    return events[dateKey].filter(event =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Calendar Grid Rendering
  const renderCalendarGrid = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = formatDate(date);
      const isToday = formatDate(new Date()) === dateKey;
      const isSelected = selectedDate && formatDate(selectedDate) === dateKey;
      const dayEvents = events[dateKey] || [];

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-24 border border-gray-200 p-2 cursor-pointer transition-colors
            ${isToday ? 'bg-blue-50' : ''}
            ${isSelected ? 'ring-2 ring-blue-500' : ''}
            hover:bg-gray-50`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{day}</span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-blue-500 text-white px-2 rounded-full">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="mt-1 space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className="text-xs p-1 rounded truncate text-white"
                style={{ backgroundColor: event.color }}
              >
                {event.name}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button onClick={handlePrevMonth} variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <Button onClick={handleNextMonth} variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={exportEvents}>Export Events</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-semibold bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-white">
        {renderCalendarGrid()}
      </div>

      {/* Event List Modal */}
      <Dialog open={showEventList} onOpenChange={setShowEventList}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Events for {selectedDate?.toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => {
                setShowEventModal(true);
                setSelectedEvent(null);
                setEventForm({
                  name: '',
                  startTime: '',
                  endTime: '',
                  description: '',
                  color: '#4A90E2'
                });
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
            <div className="space-y-2">
              {selectedDate &&
                filteredEvents(formatDate(selectedDate)).map(event => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border"
                    style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{event.name}</h3>
                        <p className="text-sm text-gray-500">
                          {event.startTime} - {event.endTime}
                        </p>
                        {event.description && (
                          <p className="text-sm mt-1">{event.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit Event' : 'Add Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                value={eventForm.name}
                onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Event Color</Label>
              <Input
                id="color"
                type="color"
                value={eventForm.color}
                onChange={(e) => setEventForm(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
            <Button onClick={handleAddEvent} className="w-full">
              {selectedEvent ? 'Update Event' : 'Add Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCalendar;