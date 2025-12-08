-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop table if exists (for development only)
DROP TABLE IF EXISTS gis_features;

-- Create gis_features table
CREATE TABLE gis_features (
    id SERIAL PRIMARY KEY,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index for better query performance
CREATE INDEX idx_gis_features_geometry ON gis_features USING GIST(geometry);

-- Create index on properties for faster JSON queries
CREATE INDEX idx_gis_features_properties ON gis_features USING GIN(properties);

-- Create index on created_at
CREATE INDEX idx_gis_features_created_at ON gis_features(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function
CREATE TRIGGER update_gis_features_updated_at 
    BEFORE UPDATE ON gis_features 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify PostGIS installation
SELECT PostGIS_Version();

-- Display table structure
\d gis_features

-- Success message
SELECT 'Database initialized successfully!' as status;