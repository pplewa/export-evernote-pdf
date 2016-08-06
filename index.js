const Evernote = require('evernote').Evernote
const promisify = require('es6-promisify')
const fs = require('fs')

function saveFileFromBytes(title, bytes) {
	const b = new Buffer(bytes)
	for (let i = 0; i < bytes.length; i++) {
		b[i] = bytes[i]
	}
	const writeFile = promisify(fs.writeFile)
	return writeFile(`${title.replace(/\//g, '-').replace(' (PDF)', '')}.pdf`, b, 'binary')
}

function exportPDF(evernoteToken, search = 'intitle:(PDF)') {
	if (!evernoteToken) {
		throw new Error('missing one of the arguments')
	}

	const filter = new Evernote.NoteFilter({ words: search, order: Evernote.NoteSortOrder.CREATED, ascending: false })
	const noteSpec = new Evernote.NotesMetadataResultSpec({ includeTitle: true })
	const evernoteClient = new Evernote.Client({ token: evernoteToken, sandbox: false })
	const noteStore = evernoteClient.getNoteStore()
	const findNotesMetadata = promisify(noteStore.findNotesMetadata)
	const getNote = promisify(noteStore.getNote)
	const deleteNote = promisify(noteStore.deleteNote)

	return findNotesMetadata(filter, 0, 1, noteSpec).then(({ notes }) => 
		getNote(notes[0].guid, false, true, false, false).then((note) => 
			saveFileFromBytes(note.title, note.resources[0].data.body).then(() => 
				deleteNote(note.guid)
			)
		)
	)
}

module.exports = exportPDF
