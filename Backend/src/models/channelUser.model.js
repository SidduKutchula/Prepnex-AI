const mongoose = require("mongoose");
const UserModel = require("./user.model");

const channelUserSchema = new mongoose.Schema({
    channel: {
        type: String,
        enum: ["whatsapp", "slack"],
        required: true,
    },
    externalId: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true,
    },
    displayName: {
        type: String,
        default: null,
    },
    profileInfo: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    linkedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Compound unique index: one mapping per channel+externalId
channelUserSchema.index({ channel: 1, externalId: 1 }, { unique: true });

/**
 * Find or create a channel user mapping.
 * Auto-creates a PrepNex user account if none exists for this external ID.
 */
channelUserSchema.statics.findOrCreateByExternalId = async function (channel, externalId, displayName) {
    let mapping = await this.findOne({ channel, externalId });
    if (mapping) return mapping;

    // Auto-create a PrepNex user for this channel user
    const UserModel = mongoose.model("users");

    // Generate a unique username from channel + external ID
    const username = `${channel}_${externalId.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const email = `${username}@${channel}.prepnex.local`; // Placeholder email

    let user = await UserModel.findOne({ email });
    if (!user) {
        user = await UserModel.create({
            username,
            email,
            name: displayName || username,
            password: null, // Channel users don't have passwords
        });
    }

    mapping = await this.create({
        channel,
        externalId,
        userId: user._id,
        displayName: displayName || null,
    });

    return mapping;
};

const ChannelUserModel = mongoose.model("ChannelUser", channelUserSchema);

module.exports = ChannelUserModel;
