import mongoose, { Document } from 'mongoose';

export interface IPoint extends Document {
  type: 'Point',
  coordinates: [number, number]
}

export interface IPolygon extends Document {
  type: 'Polygon',
  coordinates: [[[number]]]
}

/**
 *  In order for geospatial queries to work,
 * a GeoSpatial index should be created on the collection that will import this schema.
 **/

const Schema = mongoose.Schema;

const PointSchema = new Schema<IPoint>({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const PolygonSchema = new Schema<IPolygon>({
  type: {
    type: String,
    enum: ['Polygon'],
    required: true
  },
  coordinates: {
    type: [[[Number]]],
    required: true
  }
});

const getPointSchemaFromCoords = (coords: string): { type: string; coordinates: number[] } => {
  const coordinates = coords.trim().split(',').map(c => Number(c));
  return { type: 'Point', coordinates };
};

export { PointSchema, PolygonSchema, getPointSchemaFromCoords };
