
    Function                                      Test                  Status
Driver configuration

    mljs Constructor                              all                   PASS
    mljs.configure                                009-configure         PASS
    mljs.setLogger                                all                   PASS

Database Management

    mljs.exists (aka mljs.test)                   004-create-destroy    PASS
    mljs.create                                   004-create-destroy    PASS
    mljs.destroy                                  004-create-destroy    PASS

Document management

    mljs.get                                      001-save-get-delete   PASS    006-save-get-delete-in-loop   ???
    mljs.metadata                                 004-metadata          PASS
    mljs.save                                     001-save-get-delete   PASS
    mljs.merge                                    005-merge             PASS
    mljs.delete (aka mljs.remove)                 001-save-get-delete   PASS

Search

    mljs.collect                                  005-collections       PASS
    mljs.list                                     006-directory         PASS
    mljs.keyvalue                                 001-keyvalue          PASS
    mljs.search                                   003-search-query      PASS
    mljs.structuredSearch                         002-structured-search PASS

ACID Transactions

    mljs.beginTransaction (aka mljs.begin)        001-basic-trans       PASS
    mljs.commitTransaction (aka mljs.commit)      001-basic-trans       PASS
    mljs.rollbackTransaction (aka mljs.rollback)  003-rollback          PASS

REST API Extensions

    mljs.do                                       001-do                PASS
    mljs.subscribe                                NOT STARTED
    mljs.unsubscribe                              NOT STARTED

Utility functions

    mljs.fast                                     TEST - with saveAll
    mljs.ingestcsv                                NOT STARTED
    mljs.saveAll                                  NOT STARTED
