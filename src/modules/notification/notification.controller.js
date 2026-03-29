const asyncHandler = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/response");
const service = require("./notification.service");

const createAnnouncement = asyncHandler(async (req, res) => {
  const data = await service.createAnnouncement(req.user, req.body);
  return sendResponse(res, 201, "Announcement published", data);
});

const listAnnouncements = asyncHandler(async (req, res) => {
  const data = await service.listAnnouncements(req.user, req.query);
  return sendResponse(res, 200, "Announcements fetched", data.items, data.meta);
});

const listNotifications = asyncHandler(async (req, res) => {
  const data = await service.listNotifications(req.user._id, req.query);
  return sendResponse(res, 200, "Notifications fetched", data.items, data.meta);
});

const markAsRead = asyncHandler(async (req, res) => {
  const data = await service.markAsRead(req.user._id, req.params.id);
  return sendResponse(res, 200, "Notification marked as read", data);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await service.markAllAsRead(req.user._id);
  return sendResponse(res, 200, "All notifications marked as read");
});

const unreadCount = asyncHandler(async (req, res) => {
  const data = await service.getUnreadCount(req.user._id);
  return sendResponse(res, 200, "Unread count fetched", data);
});

module.exports = {
  createAnnouncement,
  listAnnouncements,
  listNotifications,
  markAsRead,
  markAllAsRead,
  unreadCount
};

