const express = require('express');
const noteRouter = express.Router();
const debug = require('debug')('app:noteRoutes');
const { MongoClient, ObjectID } = require('mongodb');
// const Note = require('../models/note')

function router(nav) {
  // middleware - all endpoints in noteRouter will check first if the user is logged in.
  // otherwise - redirect to home page (sign in)
  noteRouter.use((req, res, next) => {
    if (req.session.user) {
      next()
    }
    else {
      res.redirect('/')
    }
  })


  // list notes endpoint
  noteRouter.route('/')
    // GET /notes
    // retrieve list of all the notes of the user, sorted by status
    .get(async (req, res) => {
      let client;
      try {
        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db(process.env.DB_NAME);
        debug(`Connected to server at ${process.env.DB_URL}/${process.env.DB_NAME}`);
        // const notes = await Note.find()
        const col = await db.collection('notes');

        // get notes of a user:
        const notes = await col.find({ user: req.session.user._id }).toArray();
        // get counters:
        const { noneCompletedItems, allItems } = getCounters(notes)
        // sort notes by status:
        const sorted_notes = sortNotesByStatus(notes)
        res.render('notes', // render to note.ejs view
          {
            nav,
            notes: sorted_notes,
            counters: { noneCompletedItems, allItems }
          });
      } catch (err) {
        debug(err);
      }
      client.close();
    })

    // POST /notes
    // create new note and redirect to the new note's page
    .post(async (req, res) => {
      const { title, content, status } = req.body;
      let result;
      let client;
      try {
        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db(process.env.DB_NAME);
        debug(`Connected to server at ${process.env.DB_URL}/${process.env.DB_NAME}`);

        const col = await db.collection('notes');
        // create note:
        const note = {
          "title": title,
          "content": content,
          "status": status,
          "creationTime": Date.now,
          "user": req.session.user._id
        }
        // insert note to DB:
        const results = await col.insertOne(note)
        result = results.ops[0]
        debug(result);
      } catch (err) {
        debug(err);
      }
      client.close();
      // redirect to the new note's page
      res.redirect(`/notes/${result._id}`)
    });


  // create note middleware - render to create.ejs view
  noteRouter.route('/create')
    .get(async (req, res) => {
      debug("CREATING NOTE");
      try {
        res.render('create',
          {
            nav
          }
        );
      }
      catch {
        res.redirect('/notes')
      }

    })


  // delete middleware: ask the user if he sures
  noteRouter.route('/delete')
    // GET /notes/delete
    .get(async (req, res) => {
      noteID = getIdFromHeaders(req)
      if (noteID) {
        const note = await getNote(noteID)
        res.render('delete',
          {
            nav,
            note
          }
        );
      }
      else {
        res.redirect('/notes')
      }

    });


  // delete endpoint - delete note with id = <id> and redirect to user's notes page
  noteRouter.route('/delete/:id')
    // first, extract the note from DB
    .all(async (req, res, next) => {
      const { id } = req.params;
      req.note = await getNote(id)
      next()
    })

    // GET /notes/delete/:id
    .get(async (req, res) => {
      debug("DELETE NOTE");

      const { note } = req
      let client;
      try {
        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db(process.env.DB_NAME);
        debug(`Connected to server at ${process.env.DB_URL}/${process.env.DB_NAME}`);

        const col = await db.collection('notes');

        // delete the note
        response = await col.deleteOne({ _id: new ObjectID(note._id) })
        debug(response.result);
      } catch (err) {
        debug(err);
      }
      client.close();
      res.redirect('/notes')
    })


  // edit note middleware: exract note from DB and render edit/ejs view with the posts info
  noteRouter.route('/edit')
    // GET /notes/edit
    .get(async (req, res) => {
      noteID = getIdFromHeaders(req)
      if (noteID) {
        const note = await getNote(noteID)

        debug("EDITING NOTE");
        res.render('edit',
          {
            nav,
            note
          }
        );
      }
      else {
        res.redirect('/notes')
      }

    })


  // edit note endpoint - edit note with id = <id> with the updated info
  noteRouter.route('/edit/:id')
    // first, extract data from the request
    .all(async (req, res, next) => {
      const { id } = req.params;
      const { title, content, status } = req.body;
      req.updatedValues = { title, content, status }
      req.note = await getNote(id)
      next()
    })

    //POST /notes/edit/:id
    .post(async (req, res) => {
      debug("EDITING NOTE");
      const note = req.note
      const { title, content, status } = req.updatedValues
      let client;
      try {
        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db(process.env.DB_NAME);
        debug(`Connected to server at ${process.env.DB_URL}/${process.env.DB_NAME}`);
        const col = await db.collection('notes');

        // update note
        response = await col.updateOne(
          { _id: new ObjectID(note._id) },
          { $set: { title, content, status } }
        )
        debug(response.result);
      } catch (err) {
        debug(err);
      }
      client.close();
      res.redirect(`/notes/${note._id}`)
    })

  // single note endpoint - view a single note (render the notes page, where you may view/edit/delete it)
  noteRouter.route('/:id')
    // first, get note with id = <id>
    .all(async (req, res, next) => {
      // forward it through req.note
      const { id } = req.params;
      req.note = await getNote(id)
      next()
    })

    // GET /notes/:id
    .get((req, res) => {
      res.render('singleNote', // render to singleNote.ejs view
        {
          nav,
          note: req.note
        })
    })

  return noteRouter
}

// extract note from DB where id = <id>
async function getNote(id) {
  let note;
  let client;
  try {
    client = await MongoClient.connect(process.env.DB_URL);
    const db = client.db(process.env.DB_NAME);
    debug(`Connected to server at ${process.env.DB_URL}/${process.env.DB_NAME}`);

    const col = await db.collection('notes');

    note = await col.findOne({ _id: new ObjectID(id) })
  } catch (err) {
    debug(err);
  }
  client.close();
  return note;
}

// sort notes list by status
function sortNotesByStatus(notes) {
  var output = []
  var statuses = ["TODO", "IN PROGRESS", "BLOCKED", "DONE"]

  statuses.forEach(status => {
    notes.forEach(note => {
      if (note.status === status) {
        output.push(note)
      }
    })
  });

  return output
}

// get counters of notes list
function getCounters(notes) {

  const allItems = notes.length
  var noneCompletedItems = 0

  notes.forEach(note => {
    if (note.status != "DONE") {
      noneCompletedItems++
    }
  })

  return { noneCompletedItems, allItems }
}

// extract note id from the request
function getIdFromHeaders(req) {
  try {
    return req.headers.referer.split("/").reverse()[0]
  }
  catch {
    return null
  }
}

module.exports = router;