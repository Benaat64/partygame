import test from 'node:test';
import assert from 'node:assert/strict';
import { socketOptions } from '../src/socket/options.js';
test('origines explicites et normalisées',()=>{
 assert.deepEqual(socketOptions({CLIENT_ORIGINS:' https://sofa.vercel.app/, https://demo.example.com '}),{cors:{origin:['https://sofa.vercel.app','https://demo.example.com'],methods:['GET','POST']}});
 assert.deepEqual(socketOptions({}),{});
 for(const value of ['*','https://example.com/path','file:///tmp','https://name:secret@example.com'])assert.throws(()=>socketOptions({CLIENT_ORIGINS:value}));
});
