const Evernote = require('evernote').Evernote
const promisify = require('es6-promisify')
const fs = require('fs')

function saveFileFromBytes(title, bytes) {
	const b = new Buffer(bytes)
	for (var i = 0; i < bytes.length; i++) {
		b[i] = bytes[i]
	}
	const writeFile = promisify(fs.writeFile)
	return writeFile(title, b, 'binary')
}

function exportPDF(evernoteToken, options) {
	if (!evernoteToken) {
		throw new Error('missing one of the arguments')
	}

	if (!options.search) { 
		options.search = 'intitle:(PDF) resource:application/pdf'
	}

	const filter = new Evernote.NoteFilter({ words: options.search, order: Evernote.NoteSortOrder.CREATED, ascending: false })
	const noteSpec = new Evernote.NotesMetadataResultSpec({ includeTitle: true })
	const evernoteClient = new Evernote.Client({ token: evernoteToken, sandbox: false })
	const noteStore = evernoteClient.getNoteStore()
	const findNotesMetadata = promisify(noteStore.findNotesMetadata)
	const getNote = promisify(noteStore.getNote)
	const deleteNote = promisify(noteStore.deleteNote)

	return findNotesMetadata(filter, 0, 1, noteSpec).then((data) => 
		data.notes[0] && getNote(data.notes[0].guid, false, true, false, false).then((note) => {
			const title = `${options.path || ''}${note.title.replace(/\//g, '-').replace(' (PDF)', '')}.pdf`
			return saveFileFromBytes(title, note.resources[0].data.body).then(() => 
				deleteNote(note.guid).then(() => title)
			)
		})
	)
}

module.exports = exportPDF
