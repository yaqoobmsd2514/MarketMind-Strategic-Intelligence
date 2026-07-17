const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, minlength: 6 },
  profile: {
    bio: String, location: String, industry: String,
    experience: { type: String, default: 'idea' },
  },
  stats: {
    ideasAnalyzed: { type: Number, default: 0 },
    reportsGenerated: { type: Number, default: 0 },
    pitchesCreated: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
  },
  plan: { type: String, default: 'free' },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
