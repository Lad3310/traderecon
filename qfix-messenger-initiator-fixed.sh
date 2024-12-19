#!/bin/bash
java --add-modules java.xml.bind \
     -cp "./lib/*" \
     com.jramoyo.qfixmessenger.QFixMessenger \
     -config ./resources/initiator.cfg 