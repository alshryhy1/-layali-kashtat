-- Enable replication for the messages table to support Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
