import { OnInit, Component } from "@angular/core";
import {
    QueryResult, LiveQuery, QueryListener, Revision,
    DatabaseManager, Document, Database, AttachmentFactory, Emitter, AttachmentImage
} from 'nativescript-couchbaselite';
import { Type } from "class-transformer";

class Group {
    name: string;
}
class User implements Document {
    docId: string;
    docRev: string;
    docType: string = "USER";
    name: string;
    registerAt: number;
    secure: boolean = false;
    set registerAtDate(d: Date) {
        this.registerAt = d.getTime();
    }
    get registerAtDate() {
        return this.registerAt ? new Date(this.registerAt) : null;
    }
    @Type(() => Group) group: Group = new Group;
    getName() {
        return this.name;
    }
}
@Component({
    selector: "ns-app",
    templateUrl: "app.component.html",
})
export class AppComponent implements OnInit {
    ngOnInit() {
        let dbTest = DatabaseManager.getOrCreate({ name: "test", create: true });
        let mapping = new Map<string, any>();
        mapping.set("USER", User);
        dbTest.setMapping(mapping);
        console.log("BEFORE LIVE0.....")
        dbTest.createView({
            name: "users_live",
            revision: "2",
            map: (doc: Document, emitter) => {
                console.log("EMIT.....", doc["_id"]);
                emitter.emit(doc["_id"], null);
            }
        });
        let l = {
            last: [],
            count: 0,
            onRows(rows: QueryResult) {
                console.log("ROWS......", rows);
                l.last = rows.getDocumentsId();
                l.count++;
            }
        };
        for (let i = 0; i < 6; i++) {
            let user = new User();
            user.name = "user" + i;
            user.registerAtDate = new Date();
            user.group.name = "group" + i;
            dbTest.createDocument(user, "ID" + i);
        }
        console.log("BEFORE LIVE.....")
        let live = dbTest.liveQuery("users_live", { mapOnly: true }, l);
        live.start();
        live.waitForRows();
        console.log("BEFORE START.....")
        setTimeout(() => {
            console.log("Should emit.....", l);
            for (let i = 6; i < 12; i++) {
                let user = new User();
                user.name = "user" + i;
                user.registerAtDate = new Date();
                user.group.name = "group" + i;
                dbTest.createDocument(user, "ID" + i);
            }
        }, 3000)
    }
}
