import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const BACKGROUND_FETCH_TASK = 'background-fetch';

// Register the task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async ({ data, error }) => {
  if (error) {
    console.log("Background fetch failed", error);
    return;
  }

  const now = Date.now();
  console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`);

  

  // Fetch messages from your server with the provided arguments
  const messages = await fetchMessagesFromServer(data);

  if (messages.length > 0) {
    // Show a notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Messages',
        body: `You have ${messages.length} new message(s)`,
      },
      trigger: null, // Show immediately
    });
  }

  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// Configure the task to run every 30 minutes
async function registerBackgroundFetchAsync(data) {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 3, // 30 minutes
      stopOnTerminate: false, // android only,
      startOnBoot: true, // android only
    }, data);
    console.log('Task registered');
  } catch (err) {
    console.log('Task Register failed:', err);
  }
}

// Function to fetch messages from your server
async function fetchMessagesFromServer(user) {
  
  const {id}=user;
  console.log("12");
  // Placeholder return:
  return [];
}

// Call this function to set up the background fetch
export function setupBackgroundFetch(user) {
  registerBackgroundFetchAsync(user);
}

// Configure notifications
async function configureNotifications() {
  await Notifications.requestPermissionsAsync();
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Call this function to set up notifications
export function setupNotifications() {
  configureNotifications();
}