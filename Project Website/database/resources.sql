USE campus_booking;

INSERT INTO resources (name, category, description, location, capacity, image_url) VALUES
-- study Rooms
('Study Room A', 'Study Room', 'Quiet room for individual study', 'Library 2nd floor', 4, NULL),
('Study Room B', 'Study Room', 'Small group study room', 'Library 3rd floor', 6, NULL),
('Study Room C', 'Study Room', 'Private study area', 'Library 1st floor', 2, NULL),

-- computer Labs
('Computer Lab 1', 'Computer Lab', 'Lab with specialized software', 'Engineering Building - Room 201', 30, NULL),
('Computer Lab 2', 'Computer Lab', 'Mac and Linux lab', 'Engineering Building - Room 305', 25, NULL),
('Computer Lab 3', 'Computer Lab', 'Windows high-performance lab', 'Engineering Building - Room 112', 28, NULL),

-- sports Facilities
('Gymnasium', 'Sports Facility', 'Full-size gymnasium', 'Sports Complex 1', 100, NULL),
('Fitness Center', 'Sports Facility', 'Gym + Cardio equipment', 'Sports Complex 2', 40, NULL),
('Indoor Court', 'Sports Facility', 'Indoor basketball/volleyball court', 'Sports Complex 3', 20, NULL),

-- Event Spaces
('Event Space A', 'Event Space', 'Large multi-purpose event space', 'Hall A', 120, NULL),
('Event Space B', 'Event Space', 'Medium-sized presentation room', 'Hall B', 80, NULL),

-- Library Resources
('Library Study Pods', 'Library Resource', 'Small private pods for studying', 'Library Lower Level', 1, NULL),
('Media Room', 'Library Resource', 'Room with media equipment', 'Library Mezzanine', 5, NULL),
('Quiet Reading Room', 'Library Resource', 'Silent reading-only room', 'Library West Wing', 30, NULL);