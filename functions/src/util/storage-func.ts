// import * as admin from 'firebase-admin';
// //import {auth, storage} from '../index';
// import { FirebaseError } from 'firebase-admin';

// const storage = admin.storage();

// /**
//  * Uploads image to firebase
//  * @param {File} file file to be uploaded
//  * @param {boolean} isBusiness true if user is business, false if logged in
//  *  customer
//  * @param {JSON} metadata set of metadata
//  * @param {function} callback takes in download url if successful post, empty
//  *  string if failed
// */
// export function postPic(file: File, isBusiness: boolean,
//     metadataParam: any = undefined, callback: (URL : string) => void) {
//   const storageRef = storage.ref();
//   const metadata = (metadataParam) ? metadataParam : {contentType: 'image/jpeg'};
//   let path = (isBusiness) ? 'businessImages/' : 'customerImages/';
//   path = path + auth.currentUser.uid + '/';

//   // Upload file and metadata to the object 'images/mountains.jpg'
//   const uploadTask = storageRef.child(path + file.name).put(file, metadata);

//   // Listen for state changes, errors, and completion of the upload.
//   uploadTask.on(storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
//       function(snapshot: any) {
//       // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
//         const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//         console.log('Upload is ' + progress + '% done');
//         switch (snapshot.state) {
//           case storage.TaskState.PAUSED: // or 'paused'
//             console.log('Upload is paused');
//             break;
//           case storage.TaskState.RUNNING: // or 'running'
//             console.log('Upload is running');
//             break;
//         }
//       }, function(error: FirebaseError) {
//         console.log(error.code);
//         callback('');
//         // A full list of error codes is available at
//         // https://firebase.google.com/docs/storage/web/handle-errors
//       }, function() {
//         // Upload completed successfully, now we can get the download URL
//         uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL: string) {
//           console.log('File available at', downloadURL);
//           callback(downloadURL);
//         });
//       });
// }

// /**
//  * Obtain image from database
//  * @param {string} path path to access image (ex: businessImages/IMG_1391.HEIC)
//  * @param {function} callback takes in return value of download url on
//  *  successful get (ex: console.log)
// */
// export function getPic(path: string, callback: (URL : string) => void) {
//   const storageRef = storage.ref();
//   const starsRef = storageRef.child(path);

//   // Get the download URL
//   starsRef.getDownloadURL().then(function(url:string) {
//     callback(url);
//   }).catch(function(error: FirebaseError) {
//     console.log(error.code);
//     // A full list of error codes is available at
//     // https://firebase.google.com/docs/storage/web/handle-errors
//   });
// }

