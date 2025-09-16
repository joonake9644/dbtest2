-- Ensure an individual reservation has an end time after the start time
ALTER TABLE reservations
ADD CONSTRAINT reservations_end_after_start
CHECK (end_time > start_time);

